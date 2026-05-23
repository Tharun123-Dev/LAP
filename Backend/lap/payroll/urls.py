# payroll/urls.py
from django.urls import path
from .views import (
    SalaryStructureListView, CreateSalaryStructureView,
    UpdateSalaryStructureView, MySalaryStructureView,
    PayrollRunListView, CreatePayrollRunView,
    ProcessPayrollRunView, ApprovePayrollRunView,
    PayrollRunDetailView, UpdatePayrollEntryView,
    AddAdjustmentView, MyPayslipListView, MyPayslipDetailView,
    PayrollRegisterView,
)

urlpatterns = [
    # Salary structures
    path('payroll/salary/',               SalaryStructureListView.as_view()),
    path('payroll/salary/create/',        CreateSalaryStructureView.as_view()),
        path('payroll/salary/mine/',          MySalaryStructureView.as_view()),
    path('payroll/salary/<int:pk>/',      UpdateSalaryStructureView.as_view()),


    # Payroll runs
    path('payroll/runs/',                 PayrollRunListView.as_view()),
    path('payroll/runs/create/',          CreatePayrollRunView.as_view()),
    path('payroll/runs/<int:pk>/',        PayrollRunDetailView.as_view()),
    path('payroll/runs/<int:pk>/process/', ProcessPayrollRunView.as_view()),
    path('payroll/runs/<int:pk>/approve/', ApprovePayrollRunView.as_view()),
    path('payroll/runs/<int:pk>/register/', PayrollRegisterView.as_view()),

    # Entry level
    path('payroll/entries/<int:pk>/',               UpdatePayrollEntryView.as_view()),
    path('payroll/entries/<int:entry_pk>/adjust/',  AddAdjustmentView.as_view()),

    # Payslips (employee)
    path('payroll/payslips/',                        MyPayslipListView.as_view()),
    path('payroll/payslips/<int:month>/<int:year>/', MyPayslipDetailView.as_view()),
]