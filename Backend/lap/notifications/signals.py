# notifications/signals.py

def create_notif(user, title, body, ntype='general'):
    try:
        from notifications.models import Notification
        Notification.objects.create(user=user, title=title, body=body, type=ntype)
    except Exception as e:
        print(f"[NOTIF ERROR] {e}")


def on_leave_request(sender, instance, created, **kwargs):
    try:
        from accounts.models import User
        from employees.models import EmployeeProfile

        if created:
            # Notify employee who applied
            create_notif(
                instance.employee,
                'Leave Application Submitted',
                f'Your {instance.leave_type.name} from {instance.start_date} to {instance.end_date} ({instance.days} day(s)) has been submitted.',
                'leave_applied'
            )
            # Notify manager
            try:
                profile = EmployeeProfile.objects.get(user=instance.employee)
                if profile.manager:
                    create_notif(
                        profile.manager,
                        f'New Leave Request from {instance.employee.get_full_name() or instance.employee.username}',
                        f'{instance.employee.get_full_name() or instance.employee.username} applied for {instance.leave_type.name} from {instance.start_date} to {instance.end_date} ({instance.days} day(s)).',
                        'leave_applied'
                    )
            except Exception as e:
                print(f"[NOTIF manager] {e}")

            # Notify all HR
            for hr in User.objects.filter(role='hr', is_active=True):
                create_notif(
                    hr,
                    f'Leave Request Pending — {instance.employee.get_full_name() or instance.employee.username}',
                    f'{instance.leave_type.name} request for {instance.days} day(s) needs your review.',
                    'leave_applied'
                )

            # Notify all admins
            for admin in User.objects.filter(role='admin', is_active=True):
                create_notif(
                    admin,
                    f'Leave Request — {instance.employee.get_full_name() or instance.employee.username}',
                    f'{instance.leave_type.name} from {instance.start_date} to {instance.end_date}.',
                    'leave_applied'
                )

        else:
            if instance.status == 'approved':
                create_notif(
                    instance.employee,
                    'Leave Approved ✅',
                    f'Your {instance.leave_type.name} from {instance.start_date} to {instance.end_date} has been approved.',
                    'leave_approved'
                )
            elif instance.status == 'rejected':
                create_notif(
                    instance.employee,
                    'Leave Rejected ❌',
                    f'Your {instance.leave_type.name} from {instance.start_date} to {instance.end_date} was rejected. Reason: {instance.comment or "No reason given"}.',
                    'leave_rejected'
                )
            elif instance.status == 'cancelled':
                create_notif(
                    instance.employee,
                    'Leave Cancelled',
                    f'Your {instance.leave_type.name} request has been cancelled.',
                    'leave_cancelled'
                )
    except Exception as e:
        print(f"[NOTIF on_leave_request] {e}")


def on_attendance_absent(sender, instance, created, **kwargs):
    try:
        if created and instance.status == 'absent':
            create_notif(
                instance.employee,
                'Marked Absent 🔴',
                f'You were marked absent on {instance.date}. Submit a regularization request if incorrect.',
                'attendance_absent'
            )
    except Exception as e:
        print(f"[NOTIF on_attendance_absent] {e}")


def on_regularization(sender, instance, created, **kwargs):
    try:
        from accounts.models import User
        from employees.models import EmployeeProfile

        if created:
            try:
                profile = EmployeeProfile.objects.get(user=instance.employee)
                if profile.manager:
                    create_notif(
                        profile.manager,
                        'Regularization Request',
                        f'{instance.employee.get_full_name() or instance.employee.username} submitted regularization for {instance.attendance_record.date}.',
                        'regularization'
                    )
            except Exception as e:
                print(f"[NOTIF regularization manager] {e}")

            for hr in User.objects.filter(role='hr', is_active=True):
                create_notif(
                    hr,
                    'Regularization Request',
                    f'{instance.employee.get_full_name() or instance.employee.username} needs attendance correction for {instance.attendance_record.date}.',
                    'regularization'
                )
        else:
            if instance.status == 'approved':
                create_notif(instance.employee, 'Regularization Approved ✅',
                    f'Your attendance correction for {instance.attendance_record.date} was approved.', 'regularization')
            elif instance.status == 'rejected':
                create_notif(instance.employee, 'Regularization Rejected ❌',
                    f'Your attendance correction for {instance.attendance_record.date} was rejected.', 'regularization')
    except Exception as e:
        print(f"[NOTIF on_regularization] {e}")


def on_new_user(sender, instance, created, **kwargs):
    try:
        if created:
            create_notif(
                instance,
                f'Welcome to LAP System 👋',
                f'Hello {instance.get_full_name() or instance.username}! Your account has been created with role: {instance.role}.',
                'new_account'
            )
    except Exception as e:
        print(f"[NOTIF on_new_user] {e}")