# payroll/engine.py
"""
Payroll engine:
1. Approved paid leave → present, zero LOP
2. Approved half-day paid leave → present, zero LOP
3. Approved LOP leave → counted as LOP
4. Absent with no leave → LOP
5. Half-day attendance with no leave → 0.5 LOP
6. Late policy: every 3 late = 0.5 LOP (so 6 late = 1.0 LOP, 9 = 1.5 LOP...)
7. lop_deduction capped at gross earned
8. net_pay floored at zero
"""
import calendar
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, timedelta

from accounts.models import User
from attendance.models import AttendanceRecord
from leave.models import LeaveRequest
from .models import SalaryStructure, PayrollRun, PayrollEntry


ROUND2 = lambda v: Decimal(v).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

# Late policy constants — change these to adjust the rule
LATE_PER_HALF_DAY = 3   # every 3 lates = 0.5 LOP
                        # so every 6 lates = 1.0 LOP automatically


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def get_active_structure(employee, as_of_date):
    # Primary: most recent structure effective on or before as_of_date
    structure = SalaryStructure.objects.filter(
        employee=employee,
        is_active=True,
        effective_date__lte=as_of_date,
    ).order_by('-effective_date').first()

    if structure:
        return structure

    # Fallback: structure was created AFTER the payroll month
    # (admin created salary today and is running historical/current payroll).
    # Return the earliest active structure so no employee is skipped.
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
    """
    Returns three sets of weekday dates for the month:
      paid_full_dates — full-day approved paid leave  → present, 0 LOP
      paid_half_dates — half-day approved paid leave  → present, 0 LOP
      lop_dates       — approved LOP leave            → LOP
    Weekends excluded at source.
    """
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
    """
    Convert total late marks for the month into LOP days.
    Every LATE_PER_HALF_DAY lates = 0.5 LOP.
    e.g. 3 late → 0.5 LOP, 6 late → 1.0 LOP, 7 late → 1.0 LOP, 9 late → 1.5 LOP
    """
    half_day_units = late_count // LATE_PER_HALF_DAY
    return Decimal(str(half_day_units)) * Decimal('0.5')


def get_attendance_summary(employee, year, month):
    """
    Day-by-day walk of the month.
    Returns:
      present   — effective present days (Decimal)
      lop_days  — LOP days from absent/LOP-leave (Decimal)
      late_lop  — additional LOP days from late policy (Decimal)
      late_count — raw number of late marks this month (int)
      ot_hours  — total OT hours (Decimal)
    """
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

        if d.weekday() >= 5:        # skip weekends
            continue

        rec = record_map.get(d)

        if rec:
            if rec.status == 'present':
                present += Decimal('1')

            elif rec.status == 'late':
                # Count the late — LOP from lates is calculated at month-end
                present    += Decimal('1')
                late_count += 1

            elif rec.status == 'half_day':
                # KEY FIX: check_in with no check_out = missing checkout = 0.5 LOP
                # Without this, missing checkout was treated the same as an approved
                # paid half-day leave, giving full present credit and 0 LOP.
                missing_checkout = bool(rec.check_in and not rec.check_out)
                if missing_checkout:
                    # Missing checkout: 0.5 LOP unless paid leave covers the day
                    if d in paid_full_dates or d in paid_half_dates:
                        present += Decimal('1')   # paid leave covers it
                    else:
                        present += Decimal('0.5')
                        lop     += Decimal('0.5')  # 0.5 LOP deducted from salary
                else:
                    # Normal half-day (worked < 4h, checkout present)
                    if d in paid_half_dates or d in paid_full_dates:
                        present += Decimal('1')   # approved paid leave covers it
                    else:
                        present += Decimal('0.5')
                        lop     += Decimal('0.5')

            elif rec.status == 'absent':
                if d in paid_full_dates or d in paid_half_dates:
                    present += Decimal('1')   # paid leave → present
                elif d in lop_dates:
                    lop += Decimal('1')       # LOP leave
                else:
                    lop += Decimal('1')       # plain absent → LOP

            elif rec.status in ('leave', 'lop_leave'):
                # Written by leave approval flow
                if d in lop_dates:
                    lop += Decimal('1')
                else:
                    present += Decimal('1')

            elif rec.status in ('holiday',):
                present += Decimal('1')

            if rec.ot_hours:
                ot_hours += Decimal(str(rec.ot_hours))

        else:
            # No attendance record
            if d in paid_full_dates or d in paid_half_dates:
                present += Decimal('1')
            elif d in lop_dates:
                lop += Decimal('1')
            else:
                lop += Decimal('1')           # no record, no leave → LOP

    # Calculate late-based LOP at month end
    late_lop = calculate_late_lop(late_count)

    return {
        'present':     present,
        'lop_days':    lop,
        'late_lop':    late_lop,
        'late_count':  late_count,
        'ot_hours':    ot_hours,
    }


def prorate(amount, effective_present, working_days):
    if working_days == 0:
        return Decimal('0')
    return ROUND2(
        Decimal(str(amount)) * Decimal(str(effective_present)) / Decimal(str(working_days))
    )


def calculate_ot_pay(basic, working_days, ot_hours):
    if working_days == 0 or ot_hours == 0:
        return Decimal('0')
    hourly = Decimal(str(basic)) / Decimal(str(working_days * 8))
    return ROUND2(hourly * Decimal('1.5') * Decimal(str(ot_hours)))


def calculate_tds(gross, emp_type):
    """Simplified monthly TDS on annualised gross."""
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


# ─────────────────────────────────────────────────────────────────────────────
# Main engine
# ─────────────────────────────────────────────────────────────────────────────

def process_payroll_run(payroll_run: PayrollRun):
    month = payroll_run.month
    year  = payroll_run.year
    working_days, days_in_month = calculate_working_days(year, month)

    # Use last day of the month so any structure created within the month is found.
    # This fixes the bug where as_of=1st caused mid-month structures to be missed.
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

        # Total LOP = absence LOP + late-based LOP
        total_lop = lop_days + late_lop

        # Effective present days
        effective_present = max(
            min(Decimal(str(working_days)) - total_lop, Decimal(str(working_days))),
            Decimal('0')
        )

        # Pro-rate earnings
        basic     = prorate(structure.basic,             effective_present, working_days)
        hra       = prorate(structure.hra,               effective_present, working_days)
        da        = prorate(structure.da,                effective_present, working_days)
        special   = prorate(structure.special_allowance, effective_present, working_days)
        transport = prorate(structure.transport,         effective_present, working_days)
        medical   = prorate(structure.medical,           effective_present, working_days)
        other     = prorate(structure.other_allowance,   effective_present, working_days)
        ot_pay    = calculate_ot_pay(structure.basic, working_days, ot_hours)

        gross = basic + hra + da + special + transport + medical + other + ot_pay

        # LOP deduction — capped at gross so net never goes negative from LOP alone
        per_day_gross = ROUND2(
            Decimal(str(structure.gross)) / Decimal(str(working_days))
        ) if working_days > 0 else Decimal('0')
        lop_deduction = min(ROUND2(per_day_gross * total_lop), gross)

        # Statutory deductions
        pf_emp  = structure.pf_employee
        esi_emp = structure.esi_employee
        pt      = structure.pt
        tds     = calculate_tds(gross, emp.employee_type)

        total_deductions = ROUND2(pf_emp + esi_emp + pt + tds + lop_deduction)

        # Net pay — floored at zero
        net_pay = max(ROUND2(gross - total_deductions), Decimal('0'))

        entry = PayrollEntry.objects.create(
            payroll_run       = payroll_run,
            employee          = emp,
            salary_structure  = structure,
            total_days        = days_in_month,
            working_days      = working_days,
            present_days      = effective_present,
            lop_days          = total_lop,        # total LOP including late-based
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