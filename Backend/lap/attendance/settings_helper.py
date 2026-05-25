# attendance/settings_helper.py
"""
Single source of truth for reading all system policies.
All attendance and payroll modules import from here — nothing is hardcoded.
Keys match exactly what is stored in SystemSetting table.
"""
from datetime import time


def _get(key, default):
    """Read one SystemSetting by key. Returns default if missing or error."""
    try:
        from notifications.models import SystemSetting
        s = SystemSetting.objects.filter(key=key).first()
        if s:
            return s.get_value()
    except Exception:
        pass
    return default


def get_shift_start() -> time:
    """Shift start time. Key: work_start_time. Default: 09:00"""
    raw = _get('work_start_time', '09:00')
    try:
        h, m = str(raw).strip().split(':')
        return time(int(h), int(m))
    except Exception:
        return time(9, 0)


def get_grace_minutes() -> int:
    """Grace period in minutes. Key: grace_period_minutes. Default: 15"""
    return int(_get('grace_period_minutes', 15))


def get_standard_hours() -> float:
    """Standard working hours per day. Key: work_hours_per_day. Default: 8"""
    return float(_get('work_hours_per_day', 8))


def get_half_day_hours() -> float:
    """Hours below which = half day. Key: half_day_hours. Default: 4"""
    return float(_get('half_day_hours', 4))


def get_late_per_half_day() -> int:
    """Late marks that trigger 0.5 LOP. Key: late_marks_per_half_day. Default: 3"""
    val = int(_get('late_marks_per_half_day', 3))
    return max(val, 1)


def get_weekend_days() -> list:
    """Weekend days list. Key: weekend_days. Default: ['saturday','sunday']"""
    raw = _get('weekend_days', ['saturday', 'sunday'])
    if isinstance(raw, list):
        return raw
    try:
        import json
        return json.loads(raw)
    except Exception:
        return ['saturday', 'sunday']


def get_work_days_per_week() -> int:
    """Working days per week. Key: work_days_per_week. Default: 5"""
    return int(_get('work_days_per_week', 5))