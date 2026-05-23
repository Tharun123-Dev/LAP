# utils/apps.py
from django.apps import AppConfig


class UtilsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'utils'

    def ready(self):
        """Auto-seed permissions when Django starts."""
        try:
            from django.core.management import call_command
            call_command('seed_permissions', verbosity=0)
        except Exception:
            pass  # Silently skip if DB not ready yet (first migrate)