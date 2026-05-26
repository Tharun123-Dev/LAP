# leave/utils.py
"""
Leave utilities — all weekend/working-day logic reads from settings_helper.
Carry-forward logic lives here and is called by the management command.

ADDED:
  sync_balances_for_leave_type() — called whenever a LeaveType is created
  or its days_allowed is changed, so all existing employee LeaveBalance rows
  stay in sync without requiring manual admin action.
"""
from datetime import date, timedelta
from .models import LeaveBalance, LeaveType


def get_weekend_days_set() -> set:
    """Returns set of weekend day names from settings."""
    try:
        from attendance.settings_helper import get_weekend_days
        return set(get_weekend_days())
    except Exception:
        return {'saturday', 'sunday'}


def is_working_day(d: date) -> bool:
    """Returns True if d is NOT a weekend day per system settings."""
    DAY_NAMES = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
    return DAY_NAMES[d.weekday()] not in get_weekend_days_set()


def count_working_days(start_date: date, end_date: date, session: str = 'full') -> float:
    """
    Count working days between two dates using weekend_days setting.
    session='first_half' or 'second_half' always returns 0.5.
    """
    if session in ('first_half', 'second_half'):
        return 0.5

    count = 0
    cur = start_date
    while cur <= end_date:
        if is_working_day(cur):
            count += 1
        cur += timedelta(days=1)
    return count


def get_or_create_balance(employee, leave_type, year: int) -> LeaveBalance:
    balance, _ = LeaveBalance.objects.get_or_create(
        employee=employee,
        leave_type=leave_type,
        year=year,
        defaults={'total': leave_type.days_allowed},
    )
    return balance


def init_balances_for_employee(employee, year: int = None) -> int:
    """
    Create LeaveBalance rows for all applicable leave types for this employee/year.
    Called on first login of a new year and when a new employee is created.
    """
    if year is None:
        year = date.today().year

    emp_type = getattr(employee, 'employee_type', 'regular')
    types = LeaveType.objects.filter(
        is_active=True,
    ).filter(applicable_to__in=['all', emp_type])

    created_count = 0
    for lt in types:
        _, created = LeaveBalance.objects.get_or_create(
            employee=employee,
            leave_type=lt,
            year=year,
            defaults={'total': lt.days_allowed},
        )
        if created:
            created_count += 1

    return created_count


def sync_balances_for_leave_type(leave_type: LeaveType, year: int = None) -> dict:
    """
    Called whenever a LeaveType is created or days_allowed is changed.

    For each active employee:
      - If no LeaveBalance exists for this year → CREATE one with total=days_allowed
      - If a balance exists AND the base total (total - carried) differs from
        days_allowed → UPDATE total to keep base allocation in sync.
        (Does NOT reduce total below already-used days.)

    Returns a summary dict:  {created: N, updated: N, skipped: N}
    """
    if year is None:
        year = date.today().year

    from accounts.models import User
    emp_type = leave_type.applicable_to

    if emp_type == 'all':
        employees = User.objects.filter(is_active=True)
    else:
        employees = User.objects.filter(is_active=True, employee_type=emp_type)

    created = updated = skipped = 0

    for emp in employees:
        bal, was_created = LeaveBalance.objects.get_or_create(
            employee=emp,
            leave_type=leave_type,
            year=year,
            defaults={
                'total':   leave_type.days_allowed,
                'used':    0,
                'pending': 0,
                'carried': 0,
            },
        )
        if was_created:
            created += 1
        else:
            # Compute what the base allocation should be (total minus any carried days)
            carried = float(bal.carried or 0)
            old_base = float(bal.total) - carried
            new_base = float(leave_type.days_allowed)

            if abs(old_base - new_base) < 0.01:
                skipped += 1
                continue

            # Update total = new base + carried (preserve carry-forward days)
            bal.total = new_base + carried
            # Safety: total must not drop below used + pending
            min_total = float(bal.used) + float(bal.pending)
            if float(bal.total) < min_total:
                bal.total = min_total
            bal.save(update_fields=['total'])
            updated += 1

    return {'created': created, 'updated': updated, 'skipped': skipped, 'year': year}


def process_carry_forward(year: int = None) -> dict:
    """
    Year-end carry-forward engine.
    Called for year Y:
      - For each employee, for each leave type with carry_forward=True:
          carried = min(prev_year.remaining, lt.max_carry_forward)
      - Creates/updates next-year balance row with carried amount added to total.
      - Marks prev_year balance as processed (carried field updated).

    Returns summary dict with counts.
    """
    from attendance.settings_helper import get_el_max_carry_forward

    if year is None:
        year = date.today().year  # year = the year ENDING (carry FROM this year TO next)

    next_year = year + 1
    processed = 0
    skipped   = 0

    carry_types = LeaveType.objects.filter(is_active=True, carry_forward=True)

    for lt in carry_types:
        # Global cap from settings for EL; use lt.max_carry_forward for others
        if lt.code in ('EL', 'PL', 'AL'):
            global_cap = get_el_max_carry_forward()
            effective_cap = min(lt.max_carry_forward, global_cap) if lt.max_carry_forward > 0 else global_cap
        else:
            effective_cap = lt.max_carry_forward

        prev_balances = LeaveBalance.objects.filter(leave_type=lt, year=year)

        for prev_bal in prev_balances:
            emp = prev_bal.employee

            remaining  = float(prev_bal.remaining)
            carry_days = min(remaining, effective_cap)

            if carry_days <= 0:
                skipped += 1
                continue

            prev_bal.carried = carry_days
            prev_bal.save(update_fields=['carried'])

            next_bal, created = LeaveBalance.objects.get_or_create(
                employee=emp,
                leave_type=lt,
                year=next_year,
                defaults={'total': lt.days_allowed},
            )

            # base allocation + carry-forward
            next_bal.total   = lt.days_allowed
            next_bal.carried = carry_days
            next_bal.save(update_fields=['total', 'carried'])

            processed += 1

    return {
        'year_from': year,
        'year_to':   next_year,
        'processed': processed,
        'skipped':   skipped,
    }


def get_leave_balance_summary(employee, year: int) -> list:
    """
    Returns balance rows for employee/year including carry-forward details.
    """
    balances = LeaveBalance.objects.filter(
        employee=employee, year=year,
    ).select_related('leave_type').order_by('leave_type__name')

    result = []
    for bal in balances:
        carried   = float(bal.carried or 0)
        base      = float(bal.leave_type.days_allowed)
        total     = float(bal.total)
        used      = float(bal.used)
        pending   = float(bal.pending)
        remaining = max(total - used - pending, 0)

        this_year_remaining = max(min(remaining, base), 0)
        cf_remaining        = max(remaining - this_year_remaining, 0)

        result.append({
            'id':              bal.id,
            'leave_type_id':   bal.leave_type.id,
            'leave_type_name': bal.leave_type.name,
            'leave_type_code': bal.leave_type.code,
            'is_paid':         bal.leave_type.is_paid,
            'carry_forward':   bal.leave_type.carry_forward,
            'max_carry_forward': bal.leave_type.max_carry_forward,
            'year':            year,
            'base_allocation': base,
            'carried_forward': carried,
            'total':           total,
            'used':            used,
            'pending':         pending,
            'remaining':       remaining,
            'this_year_remaining': this_year_remaining,
            'cf_remaining':    cf_remaining,
        })

    return result
