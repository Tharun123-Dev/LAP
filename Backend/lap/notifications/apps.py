from django.apps import AppConfig

class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'

    def ready(self):
        from django.db.models.signals import post_save
        from django.apps import apps

        from notifications.signals import (
            on_leave_request,
            on_attendance_absent,
            on_regularization,
            on_new_user,
        )

        LeaveRequest         = apps.get_model('leave',       'LeaveRequest')
        AttendanceRecord     = apps.get_model('attendance',  'AttendanceRecord')
        AttendanceRegularization = apps.get_model('attendance', 'AttendanceRegularization')
        User                 = apps.get_model('accounts',    'User')

        post_save.connect(on_leave_request,     sender=LeaveRequest,             dispatch_uid='notif_leave')
        post_save.connect(on_attendance_absent, sender=AttendanceRecord,         dispatch_uid='notif_absent')
        post_save.connect(on_regularization,    sender=AttendanceRegularization, dispatch_uid='notif_regularize')
        post_save.connect(on_new_user,          sender=User,                     dispatch_uid='notif_new_user')