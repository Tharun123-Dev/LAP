# attendance/management/commands/mark_absent.py
"""
Management command: mark_absent
--------------------------------
Marks every active employee who has NO attendance record for a given date
as 'absent', so payroll engine counts it as LOP.

Run at end of each working day via cron:
    python manage.py mark_absent              # defaults to today
    python manage.py mark_absent --date 2026-05-20  # specific date

Cron example (runs at 11:59 PM every weekday):
    59 23 * * 1-5 /path/to/venv/bin/python /path/to/manage.py mark_absent

Skips:
  - Weekends (Saturday/Sunday)
  - Employees who already have any record for that date
  - Employees with an approved leave covering that date
    (those were already marked 'leave' or 'absent' by the leave approval)
"""

from datetime import date, timedelta
from django.core.management.base import BaseCommand

from accounts.models import User
from attendance.models import AttendanceRecord, Holiday
from leave.models import LeaveRequest


class Command(BaseCommand):
    help = 'Mark employees with no check-in as absent for a given date'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            default=None,
            help='Date to mark (YYYY-MM-DD). Defaults to today.',
        )

    def handle(self, *args, **options):
        raw = options.get('date')
        target = date.fromisoformat(raw) if raw else date.today()

        # Skip weekends
        if target.weekday() >= 5:
            self.stdout.write(f'{target} is a weekend — nothing to do.')
            return

        # Skip public holidays
        if Holiday.objects.filter(date=target).exists():
            self.stdout.write(f'{target} is a public holiday — nothing to do.')
            return

        employees = User.objects.filter(is_active=True)

        # Employees with an approved leave on this date
        # (already handled by leave approval flow — skip them)
        on_leave_ids = set(
            LeaveRequest.objects.filter(
                status='approved',
                start_date__lte=target,
                end_date__gte=target,
            ).values_list('employee_id', flat=True)
        )

        # Employees who already have a record for this date
        already_marked_ids = set(
            AttendanceRecord.objects.filter(
                date=target
            ).values_list('employee_id', flat=True)
        )

        marked = 0
        for emp in employees:
            if emp.id in on_leave_ids:
                continue        # leave approval already wrote the record
            if emp.id in already_marked_ids:
                continue        # already has a record (checked in, etc.)

            AttendanceRecord.objects.create(
                employee=emp,
                date=target,
                status='absent',
                note='Auto-marked absent: no check-in recorded',
            )
            marked += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'{target}: {marked} employee(s) marked absent automatically.'
            )
        )