# utils/management/commands/seed_permissions.py
from django.core.management.base import BaseCommand
from utils.models import Permission, RolePermission

ALL_PERMISSIONS = [
    # Users / Employees
    ('view_users',           'View all users'),
    ('create_employee',      'Create employee'),
    ('edit_employee',        'Edit employee'),
    ('delete_employee',      'Deactivate employee'),
    ('view_employees',       'View employees list'),
    ('manage_permissions',   'Manage role permissions'),

    # Departments
    ('view_departments',     'View departments'),
    ('create_department',    'Create department'),
    ('edit_department',      'Edit department'),
    ('delete_department',    'Delete department'),

    # Attendance
    ('view_attendance',      'View own attendance'),
    ('view_team_attendance', 'View team attendance'),
    ('approve_regularize',   'Approve regularization requests'),
    ('manage_settings',      'Manage system settings'),

    # Leave
    ('view_leave',           'View own leave'),
    ('apply_leave',          'Apply for leave'),
    ('cancel_leave',         'Cancel leave request'),
    ('view_all_leave',       'View all leave requests'),
    ('approve_leave',        'Approve/reject leave'),
    ('configure_leave',      'Configure leave types'),

    # Payroll
    ('view_salary',          'View salary structures'),
    ('configure_salary',     'Create and edit salary structures'),
    ('view_payroll',         'View payroll runs and entries'),
    ('process_payroll',      'Create and process payroll runs'),
    ('approve_payroll',      'Approve and lock payroll'),
    ('view_payslip',         'View own payslip'),

    # Reports
    ('view_reports',         'View reports'),
    ('export_reports',       'Export reports'),
]

ROLE_DEFAULTS = {
    'admin': [p[0] for p in ALL_PERMISSIONS],

    'manager': [
        'view_employees', 'view_departments',
        'view_attendance', 'view_team_attendance', 'approve_regularize',
        'view_leave', 'apply_leave', 'cancel_leave',
        'view_all_leave', 'approve_leave',
        'view_payslip', 'view_reports',
    ],

    'hr': [
        'view_employees', 'create_employee', 'edit_employee',
        'view_departments', 'create_department', 'edit_department',
        'view_attendance', 'view_team_attendance', 'approve_regularize',
        'view_leave', 'apply_leave', 'cancel_leave',
        'view_all_leave', 'approve_leave', 'configure_leave',
        'view_salary', 'view_payroll', 'view_payslip',
        'view_reports', 'export_reports',
    ],

    'employee': [
        'view_attendance',
        'view_leave', 'apply_leave', 'cancel_leave',
        'view_payslip',
    ],
}


class Command(BaseCommand):
    help = 'Seed all permissions and assign defaults to roles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset-roles',
            action='store_true',
            help='Reset role permissions to defaults',
        )

    def handle(self, *args, **options):
        # Step 1 — detect correct field name (code vs codename)
        perm_fields = [f.name for f in Permission._meta.get_fields()]
        code_field  = 'codename' if 'codename' in perm_fields else 'code'
        self.stdout.write(f'Using field: Permission.{code_field}')

        # Step 2 — create all permissions
        created_count = 0
        for code, description in ALL_PERMISSIONS:
            lookup   = {code_field: code}
            defaults = {'description': description}
            _, created = Permission.objects.get_or_create(
                **lookup, defaults=defaults
            )
            if created:
                created_count += 1
                self.stdout.write(f'  + {code}')

        self.stdout.write(self.style.SUCCESS(
            f'✓ Permissions: {created_count} new, {Permission.objects.count()} total'
        ))

        # Step 3 — assign role defaults
        if options['reset_roles']:
            RolePermission.objects.all().delete()
            self.stdout.write('  Cleared existing role permissions')

        # Detect RolePermission fields
        rp_fields = [f.name for f in RolePermission._meta.get_fields()]
        self.stdout.write(f'RolePermission fields: {rp_fields}')

        rp_created = 0
        for role, codes in ROLE_DEFAULTS.items():
            for code in codes:
                try:
                    perm_lookup = {code_field: code}
                    perm = Permission.objects.get(**perm_lookup)

                    # Build RolePermission lookup based on actual fields
                    if 'role' in rp_fields and 'permission' in rp_fields:
                        _, created = RolePermission.objects.get_or_create(
                            role=role, permission=perm
                        )
                    elif 'role' in rp_fields and 'permission_id' in rp_fields:
                        _, created = RolePermission.objects.get_or_create(
                            role=role, permission_id=perm.id
                        )
                    else:
                        self.stdout.write(self.style.WARNING(
                            f'  ⚠ Unknown RolePermission structure: {rp_fields}'
                        ))
                        break

                    if created:
                        rp_created += 1

                except Permission.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'  ⚠ Not found: {code}'))

        self.stdout.write(self.style.SUCCESS(
            f'✓ Role permissions: {rp_created} new\n'
        ))