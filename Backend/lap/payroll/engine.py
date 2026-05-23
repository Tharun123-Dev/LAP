# payroll/engine.py
"""
Payroll calculation engine.
Called when Admin hits "Process Payroll" for a month/year.
"""
import calendar
from decimal import Decimal, ROUND_HALF_UP
from datetime import date

from accounts.models import User
from attendance.models import AttendanceRecord
from .models import SalaryStructure, PayrollRun, PayrollEntry


ROUND2 = lambda v: Decimal(v).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def get_active_structure(employee, as_of_date):
    """Get the most recent active salary structure for an employee."""
    return SalaryStructure.objects.filter(
        employee=employee,
        is_active=True,
        effective_date__lte=as_of_date
    ).order_by('-effective_date').first()


def calculate_working_days(year, month):
    """Count Mon-Fri weekdays in a month."""
    _, days_in_month = calendar.monthrange(year, month)
    count = 0
    for d in range(1, days_in_month + 1):
        if date(year, month, d).weekday() < 5:
            count += 1
    return count, days_in_month


def get_attendance_summary(employee, year, month):
    """
    Summarise attendance for an employee in a given month.
    Returns dict with present, lop, ot_hours.
    """
    records = AttendanceRecord.objects.filter(
        employee=employee,
        date__year=year,
        date__month=month,
    )

    present   = Decimal('0')
    lop_days  = Decimal('0')
    ot_hours  = Decimal('0')

    for r in records:
        if r.status in ['present', 'late']:
            present += Decimal('1')
        elif r.status == 'half_day':
            present  += Decimal('0.5')
            lop_days += Decimal('0.5')
        elif r.status in ['absent']:
            lop_days += Decimal('1')
        elif r.status == 'leave':
            present += Decimal('1')   # approved leave = paid
        if r.ot_hours:
            ot_hours += Decimal(str(r.ot_hours))

    return {
        'present':  present,
        'lop_days': lop_days,
        'ot_hours': ot_hours,
    }


def prorate(amount, present_days, working_days):
    """Pro-rate a monthly component based on days present."""
    if working_days == 0:
        return Decimal('0')
    return ROUND2(Decimal(str(amount)) * Decimal(str(present_days)) / Decimal(str(working_days)))


def calculate_ot_pay(hourly_rate, ot_hours):
    """OT = 1.5x hourly rate."""
    return ROUND2(Decimal(str(hourly_rate)) * Decimal('1.5') * Decimal(str(ot_hours)))


def process_payroll_run(payroll_run: PayrollRun):
    """
    Main engine — iterates all active employees,
    computes their payroll entry for the month.
    Returns list of created PayrollEntry objects.
    """
    month = payroll_run.month
    year  = payroll_run.year
    as_of = date(year, month, 1)

    working_days, days_in_month = calculate_working_days(year, month)

    # All active employees
    employees = User.objects.filter(is_active=True).exclude(role='admin')

    created  = []
    skipped  = []

    for emp in employees:
        # Skip if entry already exists
        if PayrollEntry.objects.filter(payroll_run=payroll_run, employee=emp).exists():
            continue

        structure = get_active_structure(emp, as_of)
        if not structure:
            skipped.append(emp.username)
            continue

        att = get_attendance_summary(emp, year, month)
        present   = att['present']
        lop_days  = att['lop_days']
        ot_hours  = att['ot_hours']

        # If no attendance records at all, treat as LOP for full month
        if present == 0 and lop_days == 0:
            lop_days = Decimal(str(working_days))

        # Pro-rate earnings
        basic     = prorate(structure.basic,     present, working_days)
        hra       = prorate(structure.hra,       present, working_days)
        da        = prorate(structure.da,        present, working_days)
        special   = prorate(structure.special_allowance, present, working_days)
        transport = prorate(structure.transport, present, working_days)
        medical   = prorate(structure.medical,   present, working_days)
        other     = prorate(structure.other_allowance, present, working_days)

        # OT pay (hourly = basic / (working_days * 8))
        hourly  = (structure.basic / Decimal(str(working_days * 8))) if working_days > 0 else Decimal('0')
        ot_pay  = calculate_ot_pay(hourly, ot_hours)

        gross = basic + hra + da + special + transport + medical + other + ot_pay

        # LOP deduction
        per_day_gross = (structure.gross / Decimal(str(working_days))) if working_days > 0 else Decimal('0')
        lop_deduction = ROUND2(per_day_gross * lop_days)

        # Statutory deductions (only if basic > threshold)
        pf_emp  = structure.pf_employee   # already computed in salary structure
        esi_emp = structure.esi_employee
        pt      = structure.pt

        # TDS — simplified flat 10% for contract, 0 for intern, 5% for others
        emp_type = emp.employee_type
        if emp_type == 'contract':
            tds = ROUND2(gross * Decimal('0.10'))
        elif emp_type == 'intern':
            tds = Decimal('0')
        else:
            tds = Decimal('0')   # full TDS calc would need investment declarations

        total_deductions = pf_emp + esi_emp + pt + tds + lop_deduction
        net_pay          = ROUND2(gross - total_deductions)

        entry = PayrollEntry.objects.create(
            payroll_run      = payroll_run,
            employee         = emp,
            salary_structure = structure,
            total_days       = days_in_month,
            working_days     = working_days,
            present_days     = present,
            lop_days         = lop_days,
            ot_hours         = ot_hours,
            basic            = basic,
            hra              = hra,
            da               = da,
            special_allowance = special,
            transport        = transport,
            medical          = medical,
            other_allowance  = other,
            ot_pay           = ot_pay,
            pf_employee      = pf_emp,
            esi_employee     = esi_emp,
            pt               = pt,
            tds              = tds,
            lop_deduction    = lop_deduction,
            gross            = gross,
            total_deductions = total_deductions,
            net_pay          = net_pay,
        )
        created.append(entry)

    return created, skipped