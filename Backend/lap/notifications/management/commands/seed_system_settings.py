# notifications/management/commands/seed_system_settings.py
"""
Run: python manage.py seed_system_settings
Seeds ALL system policies. Safe to re-run — uses get_or_create.
"""
from django.core.management.base import BaseCommand
from notifications.models import SystemSetting


SETTINGS = [
    # ─── ATTENDANCE ───────────────────────────────────────────────
    dict(key='work_days_per_week',    value='5',     value_type='integer',  category='attendance',
         label='Work Days Per Week',
         description='Number of working days per week (5=Mon-Fri, 6=Mon-Sat). Affects calendar weekoffs.'),
    dict(key='work_start_time',       value='09:00', value_type='time',     category='attendance',
         label='Work Start Time',
         description='Official shift start time (HH:MM). Used for late marking.'),
    dict(key='work_end_time',         value='18:00', value_type='time',     category='attendance',
         label='Work End Time',
         description='Official shift end time (HH:MM). Used for overtime calculation.'),
    dict(key='work_hours_per_day',    value='8',     value_type='integer',  category='attendance',
         label='Work Hours Per Day',
         description='Standard working hours per day. Overtime = hours beyond this.'),
    dict(key='grace_period_minutes',  value='15',    value_type='integer',  category='attendance',
         label='Grace Period (Minutes)',
         description='Minutes after shift start before marking Late.'),
    dict(key='half_day_hours',        value='4',     value_type='decimal',  category='attendance',
         label='Half Day Threshold (Hours)',
         description='If hours worked < this value, marked as half-day absent.'),
    dict(key='auto_absent_enabled',   value='true',  value_type='boolean',  category='attendance',
         label='Auto Absent Marking',
         description='If true, nightly cron marks employees absent if no check-in recorded.'),
    dict(key='overtime_multiplier',   value='1.5',   value_type='decimal',  category='attendance',
         label='Overtime Pay Multiplier',
         description='OT pay = (daily rate / hours_per_day) x ot_hours x this multiplier.'),
    dict(key='wfh_enabled',           value='true',  value_type='boolean',  category='attendance',
         label='Work From Home Enabled',
         description='If false, WFH option is hidden from employees.'),
    dict(key='regularization_window_days', value='7', value_type='integer', category='attendance',
         label='Regularization Window (Days)',
         description='Employee can request attendance correction within this many days.'),
    dict(key='late_marks_per_half_day', value='3', value_type='integer', category='attendance',
         label='Late Marks per Half-Day LOP',
         description='Number of late arrivals in a month that triggers 0.5 LOP deduction. Default: 3 (so 6 lates = 1.0 LOP).'),
    dict(key='late_marks_per_half_day', value='3', value_type='integer', category='attendance',
         label='Late Marks per Half-Day LOP',
         description='Number of late arrivals that trigger 0.5 LOP. Default 3 means 3 late = 0.5 LOP, 6 late = 1.0 LOP.'),
    # ─── LEAVE ────────────────────────────────────────────────────
    dict(key='cl_days_per_year',      value='12',    value_type='integer',  category='leave',
         label='Casual Leave (CL) — Days/Year (Regular)',
         description='Annual CL allocation for Regular employees.'),
    dict(key='cl_monthly_cap',        value='2',     value_type='integer',  category='leave',
         label='Casual Leave — Monthly Cap',
         description='Max CL an employee can take in a single month. 0 = no cap.'),
    dict(key='sl_days_per_year',      value='12',    value_type='integer',  category='leave',
         label='Sick Leave (SL) — Days/Year (Regular)',
         description='Annual SL allocation for Regular employees.'),
    dict(key='el_days_per_year',      value='15',    value_type='integer',  category='leave',
         label='Earned Leave (EL) — Days/Year (Regular)',
         description='Annual EL allocation for Regular employees.'),
    dict(key='el_max_carry_forward',  value='45',    value_type='integer',  category='leave',
         label='Earned Leave — Max Carry Forward',
         description='Max EL days that carry forward to next year.'),
    dict(key='cl_advance_notice_days', value='2',    value_type='integer',  category='leave',
         label='CL Advance Notice (Days)',
         description='Minimum working days notice required for Casual Leave.'),
    dict(key='sl_doc_required_after_days', value='2', value_type='integer', category='leave',
         label='SL Medical Certificate After (Days)',
         description='Consecutive sick days after which medical certificate is mandatory.'),
    dict(key='sandwich_rule_enabled', value='true',  value_type='boolean',  category='leave',
         label='Sandwich Rule Enabled',
         description='If true, weekends/holidays between leave days are counted as leave.'),
    dict(key='probation_earned_leave', value='false', value_type='boolean', category='leave',
         label='Earned Leave During Probation',
         description='If false, employees on probation are not eligible for Earned Leave.'),
    dict(key='leave_encashment_enabled', value='true', value_type='boolean', category='leave',
         label='Leave Encashment Enabled',
         description='If true, EL encashment is allowed for Regular employees at year-end.'),
    dict(key='half_day_leave_enabled', value='true', value_type='boolean',  category='leave',
         label='Half Day Leave Enabled',
         description='If true, employees can apply for half-day CL and SL.'),
    dict(key='leave_balance_low_threshold', value='2', value_type='integer', category='leave',
         label='Low Balance Alert (Days)',
         description='Send notification when leave balance falls below this value.'),
    dict(key='maternity_leave_days',  value='182',   value_type='integer',  category='leave',
         label='Maternity Leave (Days)',
         description='Maternity leave days for Regular employees.'),
    dict(key='paternity_leave_days',  value='7',     value_type='integer',  category='leave',
         label='Paternity Leave (Days)',
         description='Paternity leave days for Regular employees.'),

    # ─── PAYROLL ──────────────────────────────────────────────────
    dict(key='pf_employee_percent',   value='12',    value_type='decimal',  category='payroll',
         label='PF Employee Contribution (%)',
         description='Employee PF deduction % of Basic salary.'),
    dict(key='pf_employer_percent',   value='12',    value_type='decimal',  category='payroll',
         label='PF Employer Contribution (%)',
         description='Employer PF contribution % of Basic salary.'),
    dict(key='esi_threshold_salary',  value='21000', value_type='integer',  category='payroll',
         label='ESI Applicable Salary Threshold (₹)',
         description='Gross salary below this: ESI applicable. Above: exempt.'),
    dict(key='esi_employee_percent',  value='0.75',  value_type='decimal',  category='payroll',
         label='ESI Employee Contribution (%)',
         description='Employee ESI deduction % of gross salary.'),
    dict(key='esi_employer_percent',  value='3.25',  value_type='decimal',  category='payroll',
         label='ESI Employer Contribution (%)',
         description='Employer ESI contribution % of gross salary.'),
    dict(key='basic_salary_percent',  value='40',    value_type='decimal',  category='payroll',
         label='Basic Salary (% of CTC)',
         description='Basic = CTC × this %. Used in auto salary calculation.'),
    dict(key='hra_percent_metro',     value='50',    value_type='decimal',  category='payroll',
         label='HRA (% of Basic — Metro)',
         description='HRA for metro city employees = Basic × this %.'),
    dict(key='hra_percent_nonmetro',  value='40',    value_type='decimal',  category='payroll',
         label='HRA (% of Basic — Non-Metro)',
         description='HRA for non-metro employees = Basic × this %.'),
    dict(key='payroll_lock_day',      value='25',    value_type='integer',  category='payroll',
         label='Payroll Lock Day',
         description='Day of month on which attendance is locked for payroll processing.'),
    dict(key='tds_flat_percent_contract', value='10', value_type='decimal', category='payroll',
         label='TDS Flat Rate — Contract (%)',
         description='Flat TDS deduction % for contract employees.'),

    # ─── GENERAL ──────────────────────────────────────────────────
    dict(key='company_name',          value='My Company', value_type='string', category='general',
         label='Company Name',
         description='Used in payslips, emails, and reports.'),
    dict(key='company_logo_url',      value='',      value_type='string',  category='general',
         label='Company Logo URL',
         description='Logo shown in payslips and email headers.'),
    dict(key='fiscal_year_start_month', value='4',   value_type='integer', category='general',
         label='Fiscal Year Start Month',
         description='1=January, 4=April. Affects leave year reset and payroll year.'),
    dict(key='probation_period_months', value='6',   value_type='integer', category='general',
         label='Probation Period (Months)',
         description='Employees are on probation for first N months from joining date.'),
    dict(key='weekend_days',          value='["saturday","sunday"]', value_type='json', category='general',
         label='Weekend Days',
         description='JSON list of weekend days. E.g. ["sunday"] for 6-day week, ["saturday","sunday"] for 5-day.'),
    dict(key='timezone',              value='Asia/Kolkata', value_type='string', category='general',
         label='Timezone',
         description='Company timezone for attendance timestamps.'),
    dict(key='currency',              value='INR',   value_type='string',  category='general',
         label='Currency',
         description='Currency symbol used in payroll and reports.'),
]


class Command(BaseCommand):
    help = 'Seed all system settings/policies with defaults'

    def handle(self, *args, **options):
        created = 0
        for s in SETTINGS:
            obj, was_created = SystemSetting.objects.get_or_create(
                key=s['key'],
                defaults={
                    'value':      s['value'],
                    'value_type': s['value_type'],
                    'label':      s['label'],
                    'category':   s['category'],
                    'description': s['description'],
                }
            )
            if was_created:
                created += 1
        self.stdout.write(
            self.style.SUCCESS(f'✓ Seeded {created} new settings ({len(SETTINGS)} total configured).')
        )