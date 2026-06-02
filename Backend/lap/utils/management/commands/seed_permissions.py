# utils/management/commands/seed_permissions.py
from django.core.management.base import BaseCommand
from utils.models import Permission, RolePermission

ALL_PERMISSIONS = [
    # code,                  label,                            module
    ('view_users',           'View all users',                 'users'),
    ('create_user',          'Create user',                    'users'),
    ('edit_user',            'Edit user',                      'users'),
    ('create_employee',      'Create employee',                'employees'),
    ('edit_employee',        'Edit employee',                  'employees'),
    ('delete_employee',      'Deactivate employee',            'employees'),
    ('view_employees',       'View employees list',            'employees'),
    ('manage_permissions',   'Manage role permissions',        'settings'),

    ('view_departments',     'View departments',               'departments'),
    ('create_department',    'Create department',              'departments'),
    ('edit_department',      'Edit department',                'departments'),
    ('delete_department',    'Delete department',              'departments'),

    ('view_attendance',      'View own attendance',            'attendance'),
    ('view_team_attendance', 'View team attendance',           'attendance'),
    ('approve_regularize',   'Approve regularization',         'attendance'),
    ('manage_settings',      'Manage system settings',         'settings'),

    ('view_leave',           'View own leave',                 'leave'),
    ('apply_leave',          'Apply for leave',                'leave'),
    ('cancel_leave',         'Cancel leave request',           'leave'),
    ('view_all_leave',       'View all leave requests',        'leave'),
    ('approve_leave',        'Approve/reject leave',           'leave'),
    ('configure_leave',      'Configure leave types',          'leave'),

    ('view_salary',          'View salary structures',         'payroll'),
    ('configure_salary',     'Create and edit salary',         'payroll'),
    ('view_payroll',         'View payroll runs',              'payroll'),
    ('process_payroll',      'Create and process payroll',     'payroll'),
    ('approve_payroll',      'Approve and lock payroll',       'payroll'),
    ('view_payslip',         'View own payslip',               'payroll'),

    ('view_reports',         'View reports',                   'reports'),
    ('self_reports',         'View own reports',               'reports'),
    ('export_reports',       'Export reports',                 'reports'),

    ('raise_support_ticket',        'Raise support ticket',        'support_tickets'),
    ('view_support_tickets',        'Track own support tickets',   'support_tickets'),
    ('manage_support_tickets',      'Resolve all support tickets', 'support_tickets'),
    ('manage_support_ticket_types', 'Manage ticket issue types',   'support_tickets'),
]

ALL_CODES = [p[0] for p in ALL_PERMISSIONS]

ROLE_DEFAULTS = {
    'superadmin': ALL_CODES,
    'admin':      ALL_CODES,

    'manager': [
        'view_employees', 'view_departments',
        'view_attendance', 'view_team_attendance', 'approve_regularize',
        'view_leave', 'apply_leave', 'cancel_leave',
        'view_all_leave', 'approve_leave',
        'view_payslip', 'view_reports',
        'raise_support_ticket', 'view_support_tickets',
    ],

    'hr': [
        'view_employees', 'create_employee', 'edit_employee',
        'view_departments', 'create_department', 'edit_department',
        'view_attendance', 'view_team_attendance', 'approve_regularize',
        'view_leave', 'apply_leave', 'cancel_leave',
        'view_all_leave', 'approve_leave', 'configure_leave',
        'view_salary', 'view_payroll', 'view_payslip',
        'view_reports', 'export_reports',
        'raise_support_ticket', 'view_support_tickets',
        'manage_support_tickets', 'manage_support_ticket_types',
    ],

    'employee': [
        'view_attendance',
        'view_leave', 'apply_leave', 'cancel_leave',
        'view_payslip',
        'raise_support_ticket', 'view_support_tickets',
    ],
}


class Command(BaseCommand):
    help = 'Seed all permissions and assign defaults to roles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset-roles',
            action='store_true',
            help='Reset role permissions to defaults (sets is_granted correctly)',
        )

    def handle(self, *args, **options):
        # ── Step 1: Create / update Permission rows ──────────────────────
        created_count = 0
        for code, label, module in ALL_PERMISSIONS:
            _, created = Permission.objects.update_or_create(
                code=code,
                defaults={'label': label, 'module': module},
            )
            if created:
                created_count += 1
                self.stdout.write(f'  + {code}')

        self.stdout.write(self.style.SUCCESS(
            f'OK Permissions: {created_count} new, {Permission.objects.count()} total'
        ))

        # ── Step 2: Optionally clear existing role permissions ────────────
        if options['reset_roles']:
            RolePermission.objects.all().delete()
            self.stdout.write('  Cleared existing role permissions')

        # ── Step 3: Seed RolePermission with is_granted=True ─────────────
        rp_created = rp_updated = 0
        all_roles = ['superadmin', 'admin', 'manager', 'hr', 'employee']

        for role in all_roles:
            granted_codes = set(ROLE_DEFAULTS.get(role, []))
            for code, _, _ in ALL_PERMISSIONS:
                try:
                    perm = Permission.objects.get(code=code)
                    should_grant = code in granted_codes
                    obj, created = RolePermission.objects.update_or_create(
                        role=role,
                        permission=perm,
                        defaults={'is_granted': should_grant},
                    )
                    if created:
                        rp_created += 1
                    else:
                        rp_updated += 1
                except Permission.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'  Not found: {code}'))

        self.stdout.write(self.style.SUCCESS(
            f'OK Role permissions: {rp_created} created, {rp_updated} updated\n'
        ))
        self.stdout.write(self.style.SUCCESS('OK All permissions seeded correctly!'))
