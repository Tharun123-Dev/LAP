# payroll/engine.py
"""
Payroll calculation engine — fixed version.
- LOP pulled from both attendance AND approved leave (LOP type)
- Superadmin excluded only if no salary structure
- All deductions properly calculated
"""
import calendar
from decimal import Decimal, ROUND_HALF_UP
from datetime import date

from accounts.models import User
from attendance.models import AttendanceRecord
from leave.models import LeaveRequest, LeaveType
from .models import SalaryStructure, PayrollRun, PayrollEntry


ROUND2 = lambda v: Decimal(v).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def get_active_structure(employee, as_of_date):
    return SalaryStructure.objects.filter(
        employee=employee,
        is_active=True,
        effective_date__lte=as_of_date
    ).order_by('-effective_date').first()


def calculate_working_days(year, month):
    _, days_in_month = calendar.monthrange(year, month)
    count = 0
    for d in range(1, days_in_month + 1):
        if date(year, month, d).weekday() < 5:
            count += 1
    return count, days_in_month


def get_lop_from_leave(employee, year, month):
    """
    Count LOP days from approved leave requests of type LOP
    that fall within the given month.
    """
    try:
        lop_type = LeaveType.objects.get(code='LOP')
    except LeaveType.DoesNotExist:
        return Decimal('0')

    requests = LeaveRequest.objects.filter(
        employee=employee,
        leave_type=lop_type,
        status='approved',
        start_date__year=year,
        start_date__month=month,
    )

    total = Decimal('0')
    for r in requests:
        total += Decimal(str(r.days))
    return total


def get_attendance_summary(employee, year, month):
    records = AttendanceRecord.objects.filter(
        employee=employee,
        date__year=year,
        date__month=month,
    )

    present  = Decimal('0')
    lop_att  = Decimal('0')   # LOP from attendance (absent/half-day)
    ot_hours = Decimal('0')

    for r in records:
        if r.status in ['present', 'late']:
            present += Decimal('1')
        elif r.status == 'half_day':
            present  += Decimal('0.5')
            lop_att  += Decimal('0.5')
        elif r.status == 'absent':
            lop_att  += Decimal('1')
        elif r.status in ['leave', 'holiday', 'weekend']:
            present  += Decimal('1')   # paid days
        if r.ot_hours:
            ot_hours += Decimal(str(r.ot_hours))

    # Also add LOP from leave module
    lop_leave = get_lop_from_leave(employee, year, month)
    total_lop = lop_att + lop_leave

    return {
        'present':  present,
        'lop_days': total_lop,
        'ot_hours': ot_hours,
        'has_records': records.exists(),
    }


def prorate(amount, present_days, working_days):
    if working_days == 0:
        return Decimal('0')
    return ROUND2(Decimal(str(amount)) * Decimal(str(present_days)) / Decimal(str(working_days)))


def calculate_ot_pay(basic, working_days, ot_hours):
    if working_days == 0 or ot_hours == 0:
        return Decimal('0')
    hourly = Decimal(str(basic)) / Decimal(str(working_days * 8))
    return ROUND2(hourly * Decimal('1.5') * Decimal(str(ot_hours)))


def process_payroll_run(payroll_run: PayrollRun):
    month = payroll_run.month
    year  = payroll_run.year
    as_of = date(year, month, 1)

    working_days, days_in_month = calculate_working_days(year, month)

    # All active employees (include all roles that have salary structures)
    employees = User.objects.filter(is_active=True)

    created = []
    skipped = []

    for emp in employees:
        # Skip if entry already exists
        if PayrollEntry.objects.filter(
            payroll_run=payroll_run, employee=emp
        ).exists():
            continue

        structure = get_active_structure(emp, as_of)
        if not structure:
            skipped.append(emp.username)
            continue

        att      = get_attendance_summary(emp, year, month)
        present  = att['present']
        lop_days = att['lop_days']
        ot_hours = att['ot_hours']

        # If no attendance records at all → full LOP month
        if not att['has_records']:
            lop_days = Decimal(str(working_days))
            present  = Decimal('0')

        # Effective present days for proration = working_days - lop_days
        effective_present = max(Decimal(str(working_days)) - lop_days, Decimal('0'))

        # Pro-rate all earnings
        basic     = prorate(structure.basic,             effective_present, working_days)
        hra       = prorate(structure.hra,               effective_present, working_days)
        da        = prorate(structure.da,                effective_present, working_days)
        special   = prorate(structure.special_allowance, effective_present, working_days)
        transport = prorate(structure.transport,         effective_present, working_days)
        medical   = prorate(structure.medical,           effective_present, working_days)
        other     = prorate(structure.other_allowance,   effective_present, working_days)

        # OT pay
        ot_pay = calculate_ot_pay(structure.basic, working_days, ot_hours)

        gross = basic + hra + da + special + transport + medical + other + ot_pay

        # LOP deduction = per-day-gross × lop_days
        per_day_gross = ROUND2(
            Decimal(str(structure.gross)) / Decimal(str(working_days))
        ) if working_days > 0 else Decimal('0')
        lop_deduction = ROUND2(per_day_gross * lop_days)

        # Statutory deductions from salary structure (pre-configured)
        pf_emp  = structure.pf_employee
        esi_emp = structure.esi_employee
        pt      = structure.pt

        # TDS — simplified
        emp_type = emp.employee_type
        if emp_type == 'contract':
            tds = ROUND2(gross * Decimal('0.10'))
        elif emp_type in ['intern', 'parttime']:
            tds = Decimal('0')
        else:
            # Regular — basic annual TDS slab (simplified, no investment declaration)
            annual_gross = gross * 12
            if annual_gross <= Decimal('250000'):
                tds = Decimal('0')
            elif annual_gross <= Decimal('500000'):
                tds = ROUND2((annual_gross - Decimal('250000')) * Decimal('0.05') / 12)
            elif annual_gross <= Decimal('1000000'):
                tds = ROUND2((Decimal('12500') + (annual_gross - Decimal('500000')) * Decimal('0.20')) / 12)
            else:
                tds = ROUND2((Decimal('112500') + (annual_gross - Decimal('1000000')) * Decimal('0.30')) / 12)

        total_deductions = ROUND2(pf_emp + esi_emp + pt + tds + lop_deduction)
        net_pay          = ROUND2(gross - total_deductions)

        entry = PayrollEntry.objects.create(
            payroll_run       = payroll_run,
            employee          = emp,
            salary_structure  = structure,
            total_days        = days_in_month,
            working_days      = working_days,
            present_days      = effective_present,
            lop_days          = lop_days,
            ot_hours          = ot_hours,
            basic             = basic,
            hra               = hra,
            da                = da,
            special_allowance = special,
            transport         = transport,
            medical           = medical,
            other_allowance   = other,
            ot_pay            = ot_pay,
            pf_employee       = pf_emp,
            esi_employee      = esi_emp,
            pt                = pt,
            tds               = tds,
            lop_deduction     = lop_deduction,
            gross             = gross,
            total_deductions  = total_deductions,
            net_pay           = net_pay,
        )
        created.append(entry)

    return created, skipped