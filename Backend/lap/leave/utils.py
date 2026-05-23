# leave/utils.py
from datetime import date, timedelta
from .models import LeaveBalance, LeaveType


def count_working_days(start_date, end_date, session='full'):
    """Count working days between two dates, excluding weekends."""
    if session in ['first_half', 'second_half']:
        return 0.5

    count = 0
    current = start_date
    while current <= end_date:
        if current.weekday() < 5:  # Mon-Fri
            count += 1
        current += timedelta(days=1)
    return count


def get_or_create_balance(employee, leave_type, year):
    balance, created = LeaveBalance.objects.get_or_create(
        employee   = employee,
        leave_type = leave_type,
        year       = year,
        defaults   = {'total': leave_type.days_allowed}
    )
    return balance


def init_balances_for_employee(employee, year=None):
    """Create LeaveBalance rows for all applicable leave types."""
    if year is None:
        year = date.today().year

    emp_type = employee.employee_type
    types = LeaveType.objects.filter(
        is_active=True
    ).filter(
        applicable_to__in=['all', emp_type]
    )

    created_count = 0
    for lt in types:
        _, created = LeaveBalance.objects.get_or_create(
            employee   = employee,
            leave_type = lt,
            year       = year,
            defaults   = {'total': lt.days_allowed}
        )
        if created:
            created_count += 1

    return created_count