# payroll/engine.py  — COMPLETE REPLACEMENT
"""
Fixed payroll engine:
1. Approved non-LOP leave days → counted as PRESENT (paid leave)
2. Absent days (no record, no leave) → LOP
3. LOP approved leave → deducted properly
4. Payslip shows correct present_days / lop_days
5. Net pay = Gross - (PF + ESI + PT + TDS + LOP_deduction)
"""
import calendar
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, timedelta

from accounts.models import User
from attendance.models import AttendanceRecord
from leave.models import LeaveRequest, LeaveType
from .models import SalaryStructure, PayrollRun, PayrollEntry


ROUND2 = lambda v: Decimal(v).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def get_active_structure(employee, as_of_date):
    return SalaryStructure.objects.filter(
        employee=employee,
        is_active=True,
        effective_date__lte=as_of_date,
    ).order_by('-effective_date').first()


def calculate_working_days(year, month):
    """Returns (working_days, total_days_in_month). Mon-Fri only."""
    _, days_in_month = calendar.monthrange(year, month)
    working = sum(
        1 for d in range(1, days_in_month + 1)
        if date(year, month, d).weekday() < 5
    )
    return working, days_in_month


def get_approved_leave_dates(employee, year, month):
    """
    Returns two sets of date objects for the given month:
      paid_leave_dates  — approved paid leave (CL, SL, EL, etc.) → count as present
      lop_leave_dates   — approved LOP leave → count as LOP
    """
    start_of_month = date(year, month, 1)
    end_of_month   = date(year, month, calendar.monthrange(year, month)[1])

    approved = LeaveRequest.objects.filter(
        employee=employee,
        status='approved',
        start_date__lte=end_of_month,
        end_date__gte=start_of_month,
    ).select_related('leave_type')

    paid_dates = set()
    lop_dates  = set()

    for lr in approved:
        cur = lr.start_date
        while cur <= lr.end_date:
            if cur.year == year and cur.month == month:
                if lr.leave_type.code == 'LOP':
                    lop_dates.add(cur)
                else:
                    paid_dates.add(cur)
            cur += timedelta(days=1)

    return paid_dates, lop_dates


def get_attendance_summary(employee, year, month):
    """
    Builds a per-day picture of the month and returns:
      present_days  — days physically present (including paid leave days)
      lop_days      — days with no pay (absent + LOP leave)
      ot_hours      — total OT hours
    """
    _, days_in_month   = calendar.monthrange(year, month)
    working_days, _    = calculate_working_days(year, month)

    # Fetch attendance records
    records = AttendanceRecord.objects.filter(
        employee=employee,
        date__year=year,
        date__month=month,
    )
    record_map = {r.date: r for r in records}

    # Fetch approved leave dates
    paid_leave_dates, lop_leave_dates = get_approved_leave_dates(employee, year, month)

    present  = Decimal('0')
    lop      = Decimal('0')
    ot_hours = Decimal('0')

    for day in range(1, days_in_month + 1):
        d = date(year, month, day)

        # Skip weekends
        if d.weekday() >= 5:
            continue

        rec = record_map.get(d)

        if rec:
            # Real attendance record exists
            if rec.status in ['present', 'late']:
                present += Decimal('1')
            elif rec.status == 'half_day':
                present += Decimal('0.5')
                lop     += Decimal('0.5')
            elif rec.status == 'absent':
                # Check if there's an approved paid leave for this day
                if d in paid_leave_dates:
                    present += Decimal('1')   # paid leave → present
                elif d in lop_leave_dates:
                    lop += Decimal('1')       # LOP leave → deduct
                else:
                    lop += Decimal('1')       # plain absent → LOP
            elif rec.status in ['leave', 'holiday']:
                present += Decimal('1')       # already marked leave/holiday → present

            if rec.ot_hours:
                ot_hours += Decimal(str(rec.ot_hours))

        else:
            # No record at all
            if d in paid_leave_dates:
                present += Decimal('1')   # approved paid leave → present (no record needed)
            elif d in lop_leave_dates:
                lop += Decimal('1')       # approved LOP → deduct
            else:
                lop += Decimal('1')       # no record, no leave → absent → LOP

    return {
        'present':     present,
        'lop_days':    lop,
        'ot_hours':    ot_hours,
        'has_records': records.exists() or bool(paid_leave_dates) or bool(lop_leave_dates),
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
    """Simplified TDS calculation."""
    if emp_type == 'contract':
        return ROUND2(gross * Decimal('0.10'))
    if emp_type in ['intern', 'parttime']:
        return Decimal('0')
    # Regular employee — annual slab
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
    as_of = date(year, month, 1)

    working_days, days_in_month = calculate_working_days(year, month)

    employees = User.objects.filter(is_active=True)
    created   = []
    skipped   = []

    for emp in employees:
        # Skip existing entries
        if PayrollEntry.objects.filter(payroll_run=payroll_run, employee=emp).exists():
            continue

        structure = get_active_structure(emp, as_of)
        if not structure:
            skipped.append(emp.username)
            continue

        att      = get_attendance_summary(emp, year, month)
        present  = att['present']
        lop_days = att['lop_days']
        ot_hours = att['ot_hours']

        # Effective present = working_days - lop_days (cannot go negative)
        effective_present = max(
            Decimal(str(working_days)) - lop_days,
            Decimal('0')
        )

        # Pro-rate all earnings based on effective present days
        basic     = prorate(structure.basic,             effective_present, working_days)
        hra       = prorate(structure.hra,               effective_present, working_days)
        da        = prorate(structure.da,                effective_present, working_days)
        special   = prorate(structure.special_allowance, effective_present, working_days)
        transport = prorate(structure.transport,         effective_present, working_days)
        medical   = prorate(structure.medical,           effective_present, working_days)
        other     = prorate(structure.other_allowance,   effective_present, working_days)
        ot_pay    = calculate_ot_pay(structure.basic, working_days, ot_hours)

        gross = basic + hra + da + special + transport + medical + other + ot_pay

        # LOP deduction = (full monthly gross / working_days) × lop_days
        # We use structure.gross (full month) so deduction is per-day of full salary
        per_day_gross = ROUND2(
            Decimal(str(structure.gross)) / Decimal(str(working_days))
        ) if working_days > 0 else Decimal('0')
        lop_deduction = ROUND2(per_day_gross * lop_days)

        # Statutory deductions (from salary structure — fixed amounts)
        pf_emp  = structure.pf_employee   # e.g. 12% of basic — set when creating structure
        esi_emp = structure.esi_employee  # 0.75% of gross if gross <= 21000
        pt      = structure.pt            # professional tax

        tds = calculate_tds(gross, emp.employee_type)

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