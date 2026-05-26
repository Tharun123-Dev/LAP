# payroll/engine.py
"""
Payroll Engine v3 — 100% dynamic from SystemSetting.
- PF%, ESI%, OT multiplier, PT slabs — all from settings_helper
- Working days uses weekend_days setting (5-day or 6-day week)
- LOP counted once as explicit deduction (no double-counting)
- PF/ESI/PT prorated by effective_present/working_days
- Full calculation breakdown stored per entry for payslip display
"""
import calendar
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, timedelta

from accounts.models import User
from attendance.models import AttendanceRecord
from attendance.settings_helper import (
    get_late_per_half_day, get_working_days_in_month, is_weekend,
    get_pf_employee_percent, get_pf_employer_percent,
    get_esi_employee_percent, get_esi_employer_percent, get_esi_threshold,
    get_tds_flat_contract, get_pt_slabs, get_overtime_multiplier,
)
from leave.models import LeaveRequest
from .models import SalaryStructure, PayrollRun, PayrollEntry


ROUND2 = lambda v: Decimal(str(v)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_active_structure(employee, as_of_date):
    qs = SalaryStructure.objects.filter(
        employee=employee, is_active=True, effective_date__lte=as_of_date,
    ).order_by('-effective_date')
    return qs.first() or SalaryStructure.objects.filter(
        employee=employee, is_active=True,
    ).order_by('effective_date').first()


def get_approved_leave_dates(employee, year, month):
    start_of_month = date(year, month, 1)
    end_of_month   = date(year, month, calendar.monthrange(year, month)[1])

    approved = LeaveRequest.objects.filter(
        employee=employee, status='approved',
        start_date__lte=end_of_month, end_date__gte=start_of_month,
    ).select_related('leave_type')

    paid_full_dates, paid_half_dates, lop_dates = set(), set(), set()

    for lr in approved:
        is_lop  = (not lr.leave_type.is_paid) or (lr.leave_type.code == 'LOP')
        is_half = lr.session in ('first_half', 'second_half')
        cur = lr.start_date
        while cur <= lr.end_date:
            if cur.year == year and cur.month == month and not is_weekend(cur):
                if is_lop:
                    lop_dates.add(cur)
                elif is_half:
                    paid_half_dates.add(cur)
                else:
                    paid_full_dates.add(cur)
            cur += timedelta(days=1)

    return paid_full_dates, paid_half_dates, lop_dates


def calculate_late_lop(late_count: int) -> Decimal:
    late_per_half = get_late_per_half_day()
    half_units    = late_count // late_per_half
    return Decimal(str(half_units)) * Decimal('0.5')


def calculate_pt(gross: Decimal) -> Decimal:
    """Dynamic PT based on pt_slab_json setting."""
    slabs = get_pt_slabs()
    gross_float = float(gross)
    for slab in slabs:
        if gross_float <= slab.get('upto', 0):
            return ROUND2(slab.get('pt', 0))
    return ROUND2(slabs[-1].get('pt', 200)) if slabs else ROUND2(200)


def calculate_tds(effective_gross: Decimal, emp_type: str) -> Decimal:
    """TDS — dynamic contract rate from settings, slab for regular."""
    if emp_type == 'contract':
        rate = get_tds_flat_contract() / Decimal('100')
        return ROUND2(effective_gross * rate)
    if emp_type in ('intern', 'parttime'):
        return Decimal('0')
    annual = effective_gross * 12
    if annual <= Decimal('250000'):
        return Decimal('0')
    elif annual <= Decimal('500000'):
        return ROUND2((annual - Decimal('250000')) * Decimal('0.05') / 12)
    elif annual <= Decimal('1000000'):
        return ROUND2((Decimal('12500') + (annual - Decimal('500000')) * Decimal('0.20')) / 12)
    else:
        return ROUND2((Decimal('112500') + (annual - Decimal('1000000')) * Decimal('0.30')) / 12)


def calculate_ot_pay(basic: Decimal, working_days: int, ot_hours: Decimal) -> Decimal:
    """OT = (basic / working_days / hours_per_day) × ot_multiplier × ot_hours"""
    if working_days == 0 or ot_hours == 0:
        return Decimal('0')
    from attendance.settings_helper import get_standard_hours
    hours_per_day = Decimal(str(get_standard_hours()))
    multiplier    = get_overtime_multiplier()
    hourly_rate   = Decimal(str(basic)) / (Decimal(str(working_days)) * hours_per_day)
    return ROUND2(hourly_rate * multiplier * ot_hours)


def get_attendance_summary(employee, year, month):
    _, days_in_month = calendar.monthrange(year, month)

    records = AttendanceRecord.objects.filter(
        employee=employee,
        date__year=year,
        date__month=month
    )

    record_map = {r.date: r for r in records}

    paid_full_dates, paid_half_dates, lop_dates = (
        get_approved_leave_dates(employee, year, month)
    )

    present = Decimal('0')
    lop = Decimal('0')
    ot_hrs = Decimal('0')
    late_count = 0

    # Dynamic system setting
    from attendance.settings_helper import get_auto_absent_enabled

    auto_absent_enabled = get_auto_absent_enabled()

    for day in range(1, days_in_month + 1):

        d = date(year, month, day)

        # Skip weekends
        if is_weekend(d):
            continue

        rec = record_map.get(d)

        # ─────────────────────────────────────────────
        # Attendance record exists
        # ─────────────────────────────────────────────
        if rec:

            status = str(rec.status).lower()

            # PRESENT
            if status == 'present':
                present += Decimal('1')

            # LATE
            elif status == 'late':
                present += Decimal('1')
                late_count += 1

            # HALF DAY
            elif status == 'half_day':

                if d in paid_full_dates or d in paid_half_dates:
                    present += Decimal('1')

                else:
                    present += Decimal('0.5')
                    lop += Decimal('0.5')

            # ABSENT / AUTO ABSENT / LOP
            elif status in [
                'absent',
                'auto_absent',
                'lop',
            ]:

                if d in paid_full_dates or d in paid_half_dates:
                    present += Decimal('1')

                else:

                    # Dynamic policy
                    if auto_absent_enabled:
                        lop += Decimal('1')

                    else:
                        pass

            # LEAVE
            elif status in ('leave', 'lop_leave'):

                if d in lop_dates:
                    lop += Decimal('1')

                else:
                    present += Decimal('1')

            # HOLIDAY
            elif status == 'holiday':
                present += Decimal('1')

            # OT HOURS
            if rec.ot_hours:
                ot_hrs += Decimal(str(rec.ot_hours))

        # ─────────────────────────────────────────────
        # No attendance record
        # ─────────────────────────────────────────────
        else:

            # Paid leave
            if d in paid_full_dates or d in paid_half_dates:
                present += Decimal('1')

            # LOP leave
            elif d in lop_dates:
                lop += Decimal('1')

            # Missing attendance
            else:

                # Auto absent enabled
                if auto_absent_enabled:
                    lop += Decimal('1')

                # Ignore day completely
                else:
                    pass

    late_lop = calculate_late_lop(late_count)

    return {
        'present': present,
        'lop_days': lop,
        'late_lop': late_lop,
        'late_count': late_count,
        'ot_hours': ot_hrs,
    }
# ── Main Engine ───────────────────────────────────────────────────────────────

def process_payroll_run(payroll_run: PayrollRun):
    """
    CALCULATION METHOD: Full-Pay + Explicit-LOP

    Step 1  Pay FULL monthly salary components (no proration of earnings).
    Step 2  Add OT pay (rate from overtime_multiplier setting).
    Step 3  LOP deduction = (structure.gross / working_days) × total_lop
            ↳ ONE explicit line, not hidden inside earnings proration.
    Step 4  Prorate PF, ESI, PT by (effective_present / working_days).
            ↳ Prevents deductions > pay for 1–2 day employees.
    Step 5  TDS on effective_gross (after LOP).
    Step 6  net_pay = gross − lop − pf − esi − pt − tds  (min 0).

    ALL rates (PF%, ESI%, PT slabs, OT multiplier) are read live from
    SystemSetting at runtime — changing a setting takes effect on the
    next payroll run immediately.

    Working days uses is_weekend() which respects weekend_days setting,
    so 6-day week (Sunday only off) automatically increases working_days.
    """
    month = payroll_run.month
    year  = payroll_run.year
    working_days, days_in_month = get_working_days_in_month(year, month)
    as_of = date(year, month, days_in_month)

    # Read live rates from settings
    pf_emp_pct  = get_pf_employee_percent()  / Decimal('100')
    esi_emp_pct = get_esi_employee_percent() / Decimal('100')
    esi_threshold = get_esi_threshold()

    employees = User.objects.filter(is_active=True)
    created, skipped = [], []

    for emp in employees:
        if PayrollEntry.objects.filter(payroll_run=payroll_run, employee=emp).exists():
            continue

        structure = get_active_structure(emp, as_of)
        if not structure:
            skipped.append(emp.username)
            continue

        # ── Attendance ────────────────────────────────────────────────
        att        = get_attendance_summary(emp, year, month)
        present    = att['present']
        lop_days   = att['lop_days']
        late_lop   = att['late_lop']
        late_count = att['late_count']
        ot_hours   = att['ot_hours']
        total_lop  = lop_days + late_lop

        effective_present = max(
            min(Decimal(str(working_days)) - total_lop, Decimal(str(working_days))),
            Decimal('0'),
        )

        # ── Step 1: Full monthly earnings ─────────────────────────────
        basic     = ROUND2(structure.basic)
        hra       = ROUND2(structure.hra)
        da        = ROUND2(structure.da)
        special   = ROUND2(structure.special_allowance)
        transport = ROUND2(structure.transport)
        medical   = ROUND2(structure.medical)
        other     = ROUND2(structure.other_allowance)

        # ── Step 2: OT pay (dynamic multiplier from settings) ─────────
        ot_pay = calculate_ot_pay(basic, working_days, ot_hours)
        gross  = basic + hra + da + special + transport + medical + other + ot_pay

        # ── Step 3: LOP deduction ─────────────────────────────────────
        structure_gross = Decimal(str(structure.gross))
        if working_days > 0 and total_lop > 0:
            per_day_rate  = ROUND2(structure_gross / Decimal(str(working_days)))
            lop_deduction = ROUND2(per_day_rate * total_lop)
        else:
            lop_deduction = Decimal('0')
        lop_deduction = min(lop_deduction, structure_gross)

        effective_gross = max(ROUND2(gross - lop_deduction), Decimal('0'))

        # ── Step 4: Prorate statutory deductions ──────────────────────
        ratio = (effective_present / Decimal(str(working_days))) if working_days > 0 else Decimal('0')

        # PF: dynamic % of basic (prorated)
        pf_emp  = ROUND2(basic * pf_emp_pct * ratio)

        # ESI: dynamic % of gross, only if gross <= esi_threshold (prorated)
        esi_emp = ROUND2(effective_gross * esi_emp_pct * ratio) if effective_gross <= esi_threshold else Decimal('0')

        # PT: dynamic slabs on effective_gross (prorated)
        pt_full = calculate_pt(effective_gross)
        pt      = ROUND2(pt_full * ratio)

        # ── Step 5: TDS on effective gross ────────────────────────────
        tds = calculate_tds(effective_gross, emp.employee_type)

        # ── Step 6: Net pay ───────────────────────────────────────────
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