# utils/apps.py
from django.apps import AppConfig
class UtilsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'utils'

    def ready(self):
        # Only auto-seed in runserver/wsgi, not during migrations or tests
        import sys
        if 'migrate' in sys.argv or 'makemigrations' in sys.argv or 'test' in sys.argv:
            return
        try:
            from django.db import connection
            # Check if the utils_permission table exists before seeding
            table_names = connection.introspection.table_names()
            if 'utils_permission' in table_names and 'utils_rolepermission' in table_names:
                from django.core.management import call_command
                call_command('seed_permissions', verbosity=0)
        except Exception:
            pass  # Never crash the server on startup