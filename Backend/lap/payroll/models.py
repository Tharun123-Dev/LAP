from django.db import models

# Create your models here.
# payroll/models.py
from django.db import models
from accounts.models import User


class SalaryStructure(models.Model):
    employee       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='salary_structures')
    effective_date = models.DateField()
    ctc            = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Earnings
    basic          = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    hra            = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    da             = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    special_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    transport      = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    medical        = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Deductions (employee share)
    pf_employee    = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    esi_employee   = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pt             = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # professional tax

    # Employer contributions (not deducted from salary but used for CTC)
    pf_employer    = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    esi_employer   = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    is_active      = models.BooleanField(default=True)
    created_by     = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='created_structures'
    )
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-effective_date']

    def __str__(self):
        return f"{self.employee.username} | {self.effective_date} | CTC {self.ctc}"

    @property
    def gross(self):
        return (
            self.basic + self.hra + self.da +
            self.special_allowance + self.transport +
            self.medical + self.other_allowance
        )

    @property
    def total_deductions(self):
        return self.pf_employee + self.esi_employee + self.pt

    @property
    def net_pay(self):
        return self.gross - self.total_deductions


class PayrollRun(models.Model):
    STATUS_CHOICES = [
        ('draft',     'Draft'),
        ('processed', 'Processed'),
        ('approved',  'Approved'),
        ('locked',    'Locked'),
    ]

    month        = models.IntegerField()
    year         = models.IntegerField()
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    processed_by = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='payroll_runs'
    )
    approved_by  = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='approved_payroll_runs'
    )
    notes        = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    locked_at    = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['month', 'year']
        ordering        = ['-year', '-month']

    def __str__(self):
        return f"Payroll {self.month}/{self.year} — {self.status}"


class PayrollEntry(models.Model):
    payroll_run    = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name='entries')
    employee       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payroll_entries')
    salary_structure = models.ForeignKey(SalaryStructure, null=True, on_delete=models.SET_NULL)

    # Attendance snapshot
    total_days     = models.IntegerField(default=0)
    working_days   = models.IntegerField(default=0)
    present_days   = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    lop_days       = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    ot_hours       = models.DecimalField(max_digits=6, decimal_places=2, default=0)

    # Earnings (pro-rated)
    basic          = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    hra            = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    da             = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    special_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    transport      = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    medical        = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ot_pay         = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Deductions
    pf_employee    = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    esi_employee   = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pt             = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tds            = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    lop_deduction  = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Totals
    gross          = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_pay        = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    payslip_url    = models.URLField(blank=True)
    is_paid        = models.BooleanField(default=False)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['payroll_run', 'employee']

    def __str__(self):
        return f"{self.employee.username} | {self.payroll_run}"


class PayrollAdjustment(models.Model):
    TYPE_CHOICES = [
        ('bonus',       'Bonus'),
        ('reimbursement', 'Reimbursement'),
        ('deduction',   'Deduction'),
        ('arrear',      'Arrear'),
    ]

    payroll_entry = models.ForeignKey(PayrollEntry, on_delete=models.CASCADE, related_name='adjustments')
    type         = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount       = models.DecimalField(max_digits=10, decimal_places=2)
    reason       = models.TextField()
    added_by     = models.ForeignKey(
        User, null=True, on_delete=models.SET_NULL, related_name='adjustments_added'
    )
    created_at   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} | {self.amount} | {self.payroll_entry.employee.username}"