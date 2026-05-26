# attendance/management/commands/mark_absent.py
"""
Management command: mark_absent
--------------------------------
Two jobs in one command (runs at midnight every weekday):

JOB 1 — Missing check-out (previous working day):
  If an employee checked IN yesterday but never checked OUT,
  update yesterday's record to status='half_day' and hours_worked=0
  so payroll deducts exactly 0.5 LOP for that day.

JOB 2 — No check-in at all (today):
  Employees with zero attendance record for today →
  mark absent so payroll counts it as 1 LOP.

Cron (runs at 00:05 every weekday — just after midnight):
    5 0 * * 1-5 /path/to/venv/bin/python /path/to/manage.py mark_absent

Skips weekends (settings-based), public holidays, employees on approved leave.

FIX: Weekend detection now uses settings_helper.is_weekend() instead of
     hardcoded weekday() >= 5.  Supports 5-day and 6-day work weeks.
"""

from datetime import date, timedelta
from django.core.management.base import BaseCommand

from accounts.models import User
from attendance.models import AttendanceRecord, Holiday
from leave.models import LeaveRequest


def get_prev_working_day(d):
    """Return the most recent working day before d (respects settings-based weekends)."""
    from attendance.settings_helper import is_weekend
    prev = d - timedelta(days=1)
    while is_weekend(prev):
        prev -= timedelta(days=1)
    return prev


class Command(BaseCommand):
    help = 'Auto-mark: missing check-out yesterday → half_day (0.5 LOP); no check-in today → absent'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            default=None,
            help='Date to process as TODAY (YYYY-MM-DD). Defaults to today.',
        )

    def handle(self, *args, **options):
        from attendance.settings_helper import is_weekend

        raw   = options.get('date')
        today = date.fromisoformat(raw) if raw else date.today()

        # Skip if today is weekend (settings-aware — supports 5 or 6 day week)
        if is_weekend(today):
            self.stdout.write(f'{today} is a weekend — nothing to do.')
            return

        # Skip if today is a public holiday
        if Holiday.objects.filter(date=today).exists():
            self.stdout.write(f'{today} is a public holiday — nothing to do.')
            return

        yesterday = get_prev_working_day(today)
        employees = User.objects.filter(is_active=True)

        # ── Shared helpers ────────────────────────────────────────────────────
        on_leave_today = set(
            LeaveRequest.objects.filter(
                status='approved',
                start_date__lte=today,
                end_date__gte=today,
            ).values_list('employee_id', flat=True)
        )

        already_marked_today = set(
            AttendanceRecord.objects.filter(
                date=today
            ).values_list('employee_id', flat=True)
        )

        # ── JOB 1: missing check-out yesterday → half_day on YESTERDAY ───────
        incomplete_yesterday = AttendanceRecord.objects.filter(
            date=yesterday,
            check_in__isnull=False,
            check_out__isnull=True,
            status__in=['present', 'late', 'half_day'],
        ).select_related('employee')

        job1_marked = 0
        for rec in incomplete_yesterday:
            emp = rec.employee
            if not emp.is_active:
                continue

            rec.status       = 'half_day'
            rec.hours_worked = 0
            rec.note = (rec.note + ' | ' if rec.note else '') + \
                       'CHECK-OUT MISSING — auto-converted to half day (0.5 LOP)'
            rec.save(update_fields=['status', 'hours_worked', 'note'])

            already_marked_today.add(emp.id)
            job1_marked += 1

            self.stdout.write(
                f'  [MISSING CHECKOUT] {emp.get_full_name() or emp.username} '
                f'— checked in {yesterday} but no checkout '
                f'→ half_day on {yesterday} (0.5 LOP)'
            )

        # ── JOB 2: no check-in at all today → mark absent TODAY ──────────────
        # Skip employees on approved leave — their attendance is set by LeaveActionView
        job2_marked = 0
        for emp in employees:
            if emp.id in on_leave_today:
                self.stdout.write(
                    f'  [SKIP — ON LEAVE] {emp.get_full_name() or emp.username} on approved leave today'
                )
                continue
            if emp.id in already_marked_today:
                continue

            AttendanceRecord.objects.update_or_create(
                employee=emp,
                date=today,
                defaults={
                    'status': 'absent',
                    'note':   'Auto-marked absent: no check-in recorded',
                },
            )
            job2_marked += 1
            self.stdout.write(
                f'  [ABSENT] {emp.get_full_name() or emp.username} — no check-in today'
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n{today} done — '
                f'{job1_marked} half_day (missing checkout on {yesterday}) + '
                f'{job2_marked} absent (no check-in today) = '
                f'{job1_marked + job2_marked} total marked.'
            )
        )
