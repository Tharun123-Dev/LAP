# attendance/management/commands/mark_absent.py
"""
Management command: mark_absent
--------------------------------
Two jobs in one command (runs at midnight every weekday):

JOB 1 — Missing check-out (previous working day):
  If an employee checked IN yesterday but never checked OUT,
  their record stays incomplete. Mark them absent for TODAY
  so payroll counts it as LOP. Also flag yesterday's record
  with a note so HR can see it.

JOB 2 — No check-in at all (today):
  Employees with zero attendance record for today →
  mark absent (existing logic).

Cron (runs at 00:05 every weekday — just after midnight):
    5 0 * * 1-5 /path/to/venv/bin/python /path/to/manage.py mark_absent

Skips weekends, public holidays, employees on approved leave.
"""

from datetime import date, timedelta
from django.core.management.base import BaseCommand

from accounts.models import User
from attendance.models import AttendanceRecord, Holiday
from leave.models import LeaveRequest


def get_prev_working_day(d):
    """Return the most recent weekday before d."""
    prev = d - timedelta(days=1)
    while prev.weekday() >= 5:
        prev -= timedelta(days=1)
    return prev


class Command(BaseCommand):
    help = 'Auto-absent: missing check-out yesterday → absent today; no check-in today → absent today'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            default=None,
            help='Date to process as TODAY (YYYY-MM-DD). Defaults to today.',
        )

    def handle(self, *args, **options):
        raw    = options.get('date')
        today  = date.fromisoformat(raw) if raw else date.today()
        yesterday = get_prev_working_day(today)

        # Skip if today is weekend
        if today.weekday() >= 5:
            self.stdout.write(f'{today} is a weekend — nothing to do.')
            return

        # Skip if today is a public holiday
        if Holiday.objects.filter(date=today).exists():
            self.stdout.write(f'{today} is a public holiday — nothing to do.')
            return

        employees = User.objects.filter(is_active=True)

        # --- shared helpers --------------------------------------------------
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

        # ── JOB 1: missing check-out yesterday → mark absent TODAY ───────────
        # Find yesterday's records that have check_in but no check_out
        incomplete_yesterday = AttendanceRecord.objects.filter(
            date=yesterday,
            check_in__isnull=False,
            check_out__isnull=True,
            status__in=['present', 'late', 'half_day'],  # only real check-ins
        ).select_related('employee')

        job1_marked = 0
        for rec in incomplete_yesterday:
            emp = rec.employee
            if not emp.is_active:
                continue
            if emp.id in on_leave_today:
                continue
            if emp.id in already_marked_today:
                continue

            # Flag yesterday's record so HR can see it
            rec.note = (rec.note + ' | ' if rec.note else '') + \
                       'CHECK-OUT MISSING — next day marked absent automatically'
            rec.save(update_fields=['note'])

            # Mark TODAY as absent
            AttendanceRecord.objects.create(
                employee=emp,
                date=today,
                status='absent',
                note=f'Auto-absent: check-out missing on {yesterday}',
            )
            already_marked_today.add(emp.id)   # prevent JOB 2 double-marking
            job1_marked += 1

            self.stdout.write(
                f'  [MISSING CHECKOUT] {emp.get_full_name() or emp.username} '
                f'— checked in {yesterday} but no checkout → absent {today}'
            )

        # ── JOB 2: no check-in at all today → mark absent TODAY ─────────────
        job2_marked = 0
        for emp in employees:
            if emp.id in on_leave_today:
                continue
            if emp.id in already_marked_today:
                continue

            AttendanceRecord.objects.create(
                employee=emp,
                date=today,
                status='absent',
                note='Auto-marked absent: no check-in recorded',
            )
            job2_marked += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\n{today} done — '
                f'{job1_marked} absent (missing checkout) + '
                f'{job2_marked} absent (no check-in) = '
                f'{job1_marked + job2_marked} total marked.'
            )
        )