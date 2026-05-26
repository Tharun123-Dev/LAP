# payroll/serializers.py — FULL REPLACEMENT
from rest_framework import serializers
from .models import SalaryStructure, PayrollRun, PayrollEntry, PayrollAdjustment


class SalaryStructureSerializer(serializers.ModelSerializer):
    employee_name    = serializers.SerializerMethodField()
    emp_code         = serializers.SerializerMethodField()
    created_by       = serializers.PrimaryKeyRelatedField(read_only=True)

    # ── Computed properties from the model — exposed as read-only fields ──────
    # These are @property on the model, NOT database columns.
    # Must use SerializerMethodField so DRF calls the property getter.
    basic            = serializers.SerializerMethodField()
    hra              = serializers.SerializerMethodField()
    da               = serializers.SerializerMethodField()
    special_allowance= serializers.SerializerMethodField()
    pf_employee      = serializers.SerializerMethodField()
    esi_employee     = serializers.SerializerMethodField()
    gross            = serializers.SerializerMethodField()
    total_deductions = serializers.SerializerMethodField()
    net_pay          = serializers.SerializerMethodField()
    monthly_ctc      = serializers.SerializerMethodField()

    class Meta:
        model  = SalaryStructure
        fields = [
            'id',
            'employee',
            'employee_name',
            'emp_code',
            'effective_date',
            'ctc',
            'monthly_ctc',

            # percentages (stored in DB — editable)
            'basic_percent',
            'hra_percent',
            'da_percent',
            'pf_percent',
            'esi_percent',

            # fixed allowances (stored in DB — editable)
            'transport',
            'medical',
            'other_allowance',
            'pt',

            # computed values (from @property — read-only, always correct)
            'basic',
            'hra',
            'da',
            'special_allowance',
            'pf_employee',
            'esi_employee',
            'gross',
            'total_deductions',
            'net_pay',

            'is_active',
            'created_by',
            'created_at',
        ]

    # ── Identity helpers ──────────────────────────────────────────────────────

    def get_employee_name(self, obj):
        full = obj.employee.get_full_name().strip()
        return full if full else obj.employee.username

    def get_emp_code(self, obj):
        try:
            return obj.employee.profile.emp_code
        except Exception:
            return ''

    # ── Computed salary components — round to 2 decimal places ───────────────

    def get_monthly_ctc(self, obj):
        try:
            return round(float(obj.monthly_ctc), 2)
        except Exception:
            return 0.0

    def get_basic(self, obj):
        try:
            return round(float(obj.basic), 2)
        except Exception:
            return 0.0

    def get_hra(self, obj):
        try:
            return round(float(obj.hra), 2)
        except Exception:
            return 0.0

    def get_da(self, obj):
        try:
            return round(float(obj.da), 2)
        except Exception:
            return 0.0

    def get_special_allowance(self, obj):
        try:
            val = float(obj.special_allowance)
            return round(max(val, 0.0), 2)   # never negative
        except Exception:
            return 0.0

    def get_pf_employee(self, obj):
        try:
            return round(float(obj.pf_employee), 2)
        except Exception:
            return 0.0

    def get_esi_employee(self, obj):
        try:
            return round(float(obj.esi_employee), 2)
        except Exception:
            return 0.0

    def get_gross(self, obj):
        try:
            return round(float(obj.gross), 2)
        except Exception:
            return 0.0

    def get_total_deductions(self, obj):
        try:
            return round(float(obj.total_deductions), 2)
        except Exception:
            return 0.0

    def get_net_pay(self, obj):
        try:
            return round(float(obj.net_pay), 2)
        except Exception:
            return 0.0


# ─────────────────────────────────────────────────────────────────────────────

class AdjustmentSerializer(serializers.ModelSerializer):
    added_by_name = serializers.SerializerMethodField()

    class Meta:
        model  = PayrollAdjustment
        fields = ['id', 'type', 'amount', 'reason', 'added_by', 'added_by_name', 'created_at']

    def get_added_by_name(self, obj):
        if obj.added_by:
            return obj.added_by.get_full_name() or obj.added_by.username
        return None


class PayrollRunSerializer(serializers.ModelSerializer):
    processed_by_name = serializers.SerializerMethodField()
    approved_by_name  = serializers.SerializerMethodField()
    entry_count       = serializers.SerializerMethodField()
    total_net_pay     = serializers.SerializerMethodField()

    class Meta:
        model  = PayrollRun
        fields = [
            'id', 'month', 'year', 'status', 'notes',
            'processed_by', 'processed_by_name',
            'approved_by',  'approved_by_name',
            'entry_count',  'total_net_pay',
            'created_at',   'locked_at',
        ]

    def get_processed_by_name(self, obj):
        return obj.processed_by.get_full_name() if obj.processed_by else None

    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None

    def get_entry_count(self, obj):
        return obj.entries.count()

    def get_total_net_pay(self, obj):
        return float(sum(e.net_pay for e in obj.entries.all()))


class PayrollEntrySerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    emp_code      = serializers.SerializerMethodField()
    department    = serializers.SerializerMethodField()
    adjustments   = AdjustmentSerializer(many=True, read_only=True)
    payroll_run   = PayrollRunSerializer(read_only=True)

    class Meta:
        model  = PayrollEntry
        fields = [
            'id', 'payroll_run', 'employee', 'employee_name', 'emp_code', 'department',
            'total_days', 'working_days', 'present_days', 'lop_days', 'ot_hours',
            'basic', 'hra', 'da', 'special_allowance', 'transport', 'medical',
            'other_allowance', 'ot_pay',
            'pf_employee', 'esi_employee', 'pt', 'tds', 'lop_deduction',
            'gross', 'total_deductions', 'net_pay',
            'is_paid', 'payslip_url', 'adjustments', 'created_at',
        ]

    def get_employee_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.username

    def get_emp_code(self, obj):
        try:   return obj.employee.profile.emp_code
        except: return ''

    def get_department(self, obj):
        try:   return obj.employee.profile.department.name if obj.employee.profile.department else ''
        except: return ''