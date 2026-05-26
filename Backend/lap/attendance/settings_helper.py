# attendance/settings_helper.py
"""
Single source of truth for ALL system policy reads.
Every module imports from here — nothing hardcoded anywhere.
Adding a new setting = add a getter here.
"""
from datetime import time
from decimal import Decimal


def _get(key, default):
    try:
        from notifications.models import SystemSetting
        s = SystemSetting.objects.filter(key=key).first()
        if s:
            return s.get_value()
    except Exception:
        pass
    return default


def _parse_bool(val) -> bool:
    """
    Safely coerce any value (bool, 'true', 'false', 'True', 'False', 1, 0, ...)
    to a Python bool.  Plain bool() incorrectly returns True for 'false'.
    """
    if isinstance(val, bool):
        return val
    if str(val).lower() in ('false', '0', 'no', 'off'):
        return False
    return bool(val)


# ── ATTENDANCE ────────────────────────────────────────────────────────────────

def get_shift_start() -> time:
    raw = _get('work_start_time', '09:00')
    try:
        h, m = str(raw).strip().split(':')
        return time(int(h), int(m))
    except Exception:
        return time(9, 0)


def get_shift_end() -> time:
    raw = _get('work_end_time', '18:00')
    try:
        h, m = str(raw).strip().split(':')
        return time(int(h), int(m))
    except Exception:
        return time(18, 0)


def get_grace_minutes() -> int:
    return int(_get('grace_period_minutes', 15))


def get_standard_hours() -> float:
    return float(_get('work_hours_per_day', 8))


def get_half_day_hours() -> float:
    return float(_get('half_day_hours', 4))


def get_late_per_half_day() -> int:
    return max(int(_get('late_marks_per_half_day', 3)), 1)


def get_overtime_multiplier() -> Decimal:
    return Decimal(str(_get('overtime_multiplier', 1.5)))


def get_regularization_window() -> int:
    return int(_get('regularization_window_days', 7))


def get_wfh_enabled() -> bool:
    return _parse_bool(_get('wfh_enabled', True))


def get_auto_absent_enabled() -> bool:
    """
    Returns True if the system should auto-mark absent employees.
    FIX: Uses _parse_bool() instead of bool() so that a stored value
    of 'false' / 'False' / '0' is correctly returned as False —
    plain bool('false') would wrongly return True.
    """
    return _parse_bool(_get('auto_absent_enabled', True))


def get_weekend_days() -> list:
    """Returns list like ['saturday','sunday'] or ['sunday']"""
    raw = _get('weekend_days', ['saturday', 'sunday'])
    if isinstance(raw, list):
        return [d.lower() for d in raw]
    try:
        import json
        parsed = json.loads(raw)
        return [d.lower() for d in parsed]
    except Exception:
        return ['saturday', 'sunday']


def get_work_days_per_week() -> int:
    return int(_get('work_days_per_week', 5))


def is_weekend(date_obj) -> bool:
    """
    Returns True if date_obj falls on a configured weekend day.
    Uses weekend_days setting — works for both 5-day and 6-day weeks.
    """
    DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    day_name = DAY_NAMES[date_obj.weekday()]
    return day_name in get_weekend_days()


def get_working_days_in_month(year: int, month: int) -> tuple:
    """
    Returns (working_days, total_days_in_month) using weekend_days setting.
    Replaces hardcoded weekday < 5 logic everywhere.
    """
    import calendar
    from datetime import date
    _, days_in_month = calendar.monthrange(year, month)
    working = sum(
        1 for d in range(1, days_in_month + 1)
        if not is_weekend(date(year, month, d))
    )
    return working, days_in_month


# ── PAYROLL ───────────────────────────────────────────────────────────────────

def get_pf_employee_percent() -> Decimal:
    """PF employee contribution % of Basic. Default 12."""
    return Decimal(str(_get('pf_employee_percent', 12)))


def get_pf_employer_percent() -> Decimal:
    """PF employer contribution % of Basic. Default 12."""
    return Decimal(str(_get('pf_employer_percent', 12)))


def get_esi_employee_percent() -> Decimal:
    """ESI employee contribution % of gross. Default 0.75."""
    return Decimal(str(_get('esi_employee_percent', 0.75)))


def get_esi_employer_percent() -> Decimal:
    """ESI employer contribution % of gross. Default 3.25."""
    return Decimal(str(_get('esi_employer_percent', 3.25)))


def get_esi_threshold() -> Decimal:
    """Gross salary above this = ESI exempt. Default 21000."""
    return Decimal(str(_get('esi_threshold_salary', 21000)))


def get_tds_flat_contract() -> Decimal:
    """Flat TDS % for contract employees. Default 10."""
    return Decimal(str(_get('tds_flat_percent_contract', 10)))


def get_pt_slabs() -> list:
    """
    Returns PT slabs as list of dicts: [{'upto': 20000, 'pt': 150}, ...]
    Sorted ascending by upto. Last entry catches all remaining.
    """
    default = [
        {'upto': 15000,     'pt': 0},
        {'upto': 20000,     'pt': 150},
        {'upto': 99999999,  'pt': 200},
    ]
    raw = _get('pt_slab_json', default)
    if isinstance(raw, list):
        return sorted(raw, key=lambda x: x.get('upto', 0))
    try:
        import json
        return sorted(json.loads(raw), key=lambda x: x.get('upto', 0))
    except Exception:
        return default


def get_basic_salary_percent() -> Decimal:
    return Decimal(str(_get('basic_salary_percent', 40)))


def get_hra_metro_percent() -> Decimal:
    return Decimal(str(_get('hra_percent_metro', 50)))


def get_hra_nonmetro_percent() -> Decimal:
    return Decimal(str(_get('hra_percent_nonmetro', 40)))


def get_payroll_lock_day() -> int:
    return int(_get('payroll_lock_day', 25))


# ── LEAVE ─────────────────────────────────────────────────────────────────────

def get_leave_year_basis() -> str:
    """'calendar' or 'fiscal'"""
    return str(_get('leave_year_basis', 'calendar'))


def get_carry_forward_month() -> int:
    return int(_get('carry_forward_month', 1))




def get_half_day_leave_enabled() -> bool:
    return _parse_bool(_get('half_day_leave_enabled', True))


def get_leave_low_threshold() -> int:
    return int(_get('leave_balance_low_threshold', 2))


def get_sandwich_rule() -> bool:
    return _parse_bool(_get('sandwich_rule_enabled', True))


# ── GENERAL ───────────────────────────────────────────────────────────────────

def get_company_name() -> str:
    return str(_get('company_name', 'My Company'))


def get_currency() -> str:
    return str(_get('currency', 'INR'))


def get_fiscal_year_start_month() -> int:
    return int(_get('fiscal_year_start_month', 4))


def get_probation_months() -> int:
    return int(_get('probation_period_months', 6))


def get_cl_advance_notice_days() -> int:
    """Advance notice days required for Casual Leave — from System Settings."""
    return int(_get('cl_advance_notice_days', 0))


def get_sl_advance_notice_days() -> int:
    """Advance notice days required for Sick Leave — from System Settings."""
    return int(_get('sl_advance_notice_days', 0))


def get_el_advance_notice_days() -> int:
    """Advance notice days required for Earned Leave — from System Settings."""
    return int(_get('el_advance_notice_days', 0))


def get_leave_advance_notice_days(leave_code: str) -> int:
    """
    Returns the system-settings advance notice days for any leave type code.
    Reads <code_lower>_advance_notice_days from SystemSetting.
    Falls back to 0 if no setting found.
    """
    code = (leave_code or '').upper()
    if code == 'CL':
        return get_cl_advance_notice_days()
    if code == 'SL':
        return get_sl_advance_notice_days()
    if code == 'EL':
        return get_el_advance_notice_days()
    # Generic fallback: try <code_lower>_advance_notice_days
    key = f"{leave_code.lower()}_advance_notice_days"
    val = _get(key, None)
    if val is not None:
        try:
            return int(val)
        except (ValueError, TypeError):
            pass
    return 0


def get_leave_days_allowed(leave_code: str) -> int:
    """
    Returns system-settings days_allowed for any leave type code.
    Reads <code_lower>_days_per_year from SystemSetting.
    Returns -1 if no setting found (caller should use LeaveType.days_allowed).
    """
    code = (leave_code or '').lower()
    key  = f"{code}_days_per_year"
    val  = _get(key, None)
    if val is not None:
        try:
            return int(val)
        except (ValueError, TypeError):
            pass
    return -1


def get_leave_is_paid(leave_code: str) -> int:
    """
    Returns system-settings is_paid override for a leave code.
    Reads <code_lower>_is_paid from SystemSetting.
    Returns -1 if no setting found (caller uses LeaveType.is_paid).
    """
    code = (leave_code or '').lower()
    key  = f"{code}_is_paid"
    val  = _get(key, None)
    if val is not None:
        if isinstance(val, bool):
            return 1 if val else 0
        if str(val).lower() in ('true', '1', 'yes'):
            return 1
        if str(val).lower() in ('false', '0', 'no'):
            return 0
    return -1


def get_leave_carry_forward(leave_code: str) -> int:
    """
    Returns system-settings carry_forward override for a leave code.
    Returns -1 if no setting found.
    """
    code = (leave_code or '').lower()
    key  = f"{code}_carry_forward"
    val  = _get(key, None)
    if val is not None:
        if isinstance(val, bool):
            return 1 if val else 0
        if str(val).lower() in ('true', '1', 'yes'):
            return 1
        if str(val).lower() in ('false', '0', 'no'):
            return 0
    return -1