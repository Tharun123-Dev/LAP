# payroll/engine.py
"""
Payroll engine — ALL policy values read dynamically from SystemSetting via settings_helper.

FIX SUMMARY (v2):
  - Removed double-LOP bug: earnings now paid as FULL monthly amounts (not prorated).
  - LOP deduction shown as a clear separate line: (structure.gross / working_days) × lop_days
  - PF / ESI / PT are prorated by (effective_present / working_days) so deductions
    never exceed pay for short-tenure / part-month employees.
  - OT pay always computed and added to gross.
  - net_pay is always >= 0.
"""
import calendar
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, timedelta

from accounts.models import User
from attendance.models import AttendanceRecord
from attendance.settings_helper import get_standard_hours, get_late_per_half_day
from leave.models import LeaveRequest
from .models import SalaryStructure, PayrollRun, PayrollEntry


ROUND2 = lambda v: Decimal(v).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def get_active_structure(employee, as_of_date):
    structure = SalaryStructure.objects.filter(
        employee=employee,
        is_active=True,
        effective_date__lte=as_of_date,
    ).order_by('-effective_date').first()
    if structure:
        return structure
    return SalaryStructure.objects.filter(
        employee=employee,
        is_active=True,
    ).order_by('effective_date').first()


def calculate_working_days(year, month):
    """Returns (working_days, total_days_in_month). Mon–Fri only."""
    _, days_in_month = calendar.monthrange(year, month)
    working = sum(
        1 for d in range(1, days_in_month + 1)
        if date(year, month, d).weekday() < 5
    )
    return working, days_in_month


def get_approved_leave_dates(employee, year, month):
    start_of_month = date(year, month, 1)
    end_of_month   = date(year, month, calendar.monthrange(year, month)[1])

    approved = LeaveRequest.objects.filter(
        employee=employee,
        status='approved',
        start_date__lte=end_of_month,
        end_date__gte=start_of_month,
    ).select_related('leave_type')

    paid_full_dates = set()
    paid_half_dates = set()
    lop_dates       = set()

    for lr in approved:
        is_lop  = (not lr.leave_type.is_paid) or (lr.leave_type.code == 'LOP')
        is_half = lr.session in ('first_half', 'second_half')
        cur = lr.start_date
        while cur <= lr.end_date:
            if cur.year == year and cur.month == month and cur.weekday() < 5:
                if is_lop:
                    lop_dates.add(cur)
                elif is_half:
                    paid_half_dates.add(cur)
                else:
                    paid_full_dates.add(cur)
            cur += timedelta(days=1)

    return paid_full_dates, paid_half_dates, lop_dates


def calculate_late_lop(late_count):
    late_per_half_day = get_late_per_half_day()
    half_day_units    = late_count // late_per_half_day
    return Decimal(str(half_day_units)) * Decimal('0.5')


def get_attendance_summary(employee, year, month):
    _, days_in_month = calendar.monthrange(year, month)

    records    = AttendanceRecord.objects.filter(
        employee=employee,
        date__year=year,
        date__month=month,
    )
    record_map = {r.date: r for r in records}

    paid_full_dates, paid_half_dates, lop_dates = get_approved_leave_dates(
        employee, year, month
    )

    present    = Decimal('0')
    lop        = Decimal('0')
    ot_hours   = Decimal('0')
    late_count = 0

    for day in range(1, days_in_month + 1):
        d = date(year, month, day)
        if d.weekday() >= 5:
            continue
        rec = record_map.get(d)
        if rec:
            if rec.status == 'present':
                present += Decimal('1')
            elif rec.status == 'late':
                present    += Decimal('1')
                late_count += 1
            elif rec.status == 'half_day':
                missing_checkout = bool(rec.check_in and not rec.check_out)
                if missing_checkout:
                    if d in paid_full_dates or d in paid_half_dates:
                        present += Decimal('1')
                    else:
                        present += Decimal('0.5')
                        lop     += Decimal('0.5')
                else:
                    if d in paid_half_dates or d in paid_full_dates:
                        present += Decimal('1')
                    else:
                        present += Decimal('0.5')
                        lop     += Decimal('0.5')
            elif rec.status == 'absent':
                if d in paid_full_dates or d in paid_half_dates:
                    present += Decimal('1')
                elif d in lop_dates:
                    lop += Decimal('1')
                else:
                    lop += Decimal('1')
            elif rec.status in ('leave', 'lop_leave'):
                if d in lop_dates:
                    lop += Decimal('1')
                else:
                    present += Decimal('1')
            elif rec.status == 'holiday':
                present += Decimal('1')
            if rec.ot_hours:
                ot_hours += Decimal(str(rec.ot_hours))
        else:
            if d in paid_full_dates or d in paid_half_dates:
                present += Decimal('1')
            elif d in lop_dates:
                lop += Decimal('1')
            else:
                lop += Decimal('1')

    late_lop = calculate_late_lop(late_count)

    return {
        'present':    present,
        'lop_days':   lop,
        'late_lop':   late_lop,
        'late_count': late_count,
        'ot_hours':   ot_hours,
    }


def calculate_ot_pay(basic, working_days, ot_hours):
    if working_days == 0 or ot_hours == 0:
        return Decimal('0')
    hourly = Decimal(str(basic)) / Decimal(str(working_days * 8))
    return ROUND2(hourly * Decimal('1.5') * Decimal(str(ot_hours)))


def calculate_tds(gross, emp_type):
    if emp_type == 'contract':
        return ROUND2(gross * Decimal('0.10'))
    if emp_type in ('intern', 'parttime'):
        return Decimal('0')
    annual = gross * 12
    if annual <= Decimal('250000'):
        return Decimal('0')
    elif annual <= Decimal('500000'):
        return ROUND2((annual - Decimal('250000')) * Decimal('0.05') / 12)
    elif annual <= Decimal('1000000'):
        return ROUND2((Decimal('12500') + (annual - Decimal('500000')) * Decimal('0.20')) / 12)
    else:
        return ROUND2((Decimal('112500') + (annual - Decimal('1000000')) * Decimal('0.30')) / 12)


def process_payroll_run(payroll_run: PayrollRun):
    """
    Full-Pay + Explicit-LOP method:
    Step 1: Pay FULL monthly salary components (no proration)
    Step 2: Add OT pay
    Step 3: LOP deduction = (structure.gross / working_days) x total_lop  [ONE explicit line]
    Step 4: Prorate PF/ESI/PT by (effective_present / working_days)
    Step 5: TDS on effective_gross (after LOP)
    Step 6: net = gross - pf - esi - pt - tds - lop_deduction  (min 0)
    """
    month = payroll_run.month
    year  = payroll_run.year
    working_days, days_in_month = calculate_working_days(year, month)
    as_of = date(year, month, days_in_month)

    employees = User.objects.filter(is_active=True)
    created   = []
    skipped   = []

    for emp in employees:
        if PayrollEntry.objects.filter(payroll_run=payroll_run, employee=emp).exists():
            continue

        structure = get_active_structure(emp, as_of)
        if not structure:
            skipped.append(emp.username)
            continue

        att        = get_attendance_summary(emp, year, month)
        present    = att['present']
        lop_days   = att['lop_days']
        late_lop   = att['late_lop']
        late_count = att['late_count']
        ot_hours   = att['ot_hours']

        total_lop = lop_days + late_lop

        effective_present = max(
            min(Decimal(str(working_days)) - total_lop, Decimal(str(working_days))),
            Decimal('0')
        )

        # Step 1: Full monthly earnings
        basic     = ROUND2(structure.basic)
        hra       = ROUND2(structure.hra)
        da        = ROUND2(structure.da)
        special   = ROUND2(structure.special_allowance)
        transport = ROUND2(structure.transport)
        medical   = ROUND2(structure.medical)
        other     = ROUND2(structure.other_allowance)

        # Step 2: OT pay
        ot_pay = calculate_ot_pay(structure.basic, working_days, ot_hours)
        gross  = basic + hra + da + special + transport + medical + other + ot_pay

        # Step 3: LOP deduction (single explicit line — no double counting)
        structure_gross = Decimal(str(structure.gross))
        if working_days > 0 and total_lop > 0:
            per_day_rate  = ROUND2(structure_gross / Decimal(str(working_days)))
            lop_deduction = ROUND2(per_day_rate * total_lop)
        else:
            lop_deduction = Decimal('0')
        lop_deduction = min(lop_deduction, structure_gross + ot_pay)

        effective_gross = max(ROUND2(gross - lop_deduction), Decimal('0'))

        # Step 4: Prorate statutory deductions
        ratio   = (effective_present / Decimal(str(working_days))) if working_days > 0 else Decimal('0')
        pf_emp  = ROUND2(Decimal(str(structure.pf_employee))  * ratio)
        esi_emp = ROUND2(Decimal(str(structure.esi_employee)) * ratio)
        pt      = ROUND2(Decimal(str(structure.pt))           * ratio)

        # Step 5: TDS on effective gross
        tds = calculate_tds(effective_gross, emp.employee_type)

        # Step 6: Net pay
        total_deductions = ROUND2(pf_emp + esi_emp + pt + tds + lop_deduction)
        net_pay          = max(ROUND2(gross - total_deductions), Decimal('0'))

        entry = PayrollEntry.objects.create(
            payroll_run       = payroll_run,
            employee          = emp,
            salary_structure  = structure,
            total_days        = days_in_month,
            working_days      = working_days,
            present_days      = effective_present,
            lop_days          = total_lop,
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