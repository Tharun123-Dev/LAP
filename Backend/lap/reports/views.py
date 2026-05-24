# reports/views.py
import csv
import calendar
from datetime import date, timedelta
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from utils.permissions import make_permission, IsAuthenticatedUser


def csv_response(headers, rows, filename):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    w = csv.writer(response)
    w.writerow(headers)
    for row in rows:
        w.writerow(row)
    return response


class AttendanceReportView(APIView):
    permission_classes = [make_permission('view_reports')]

    def get(self, request):
        from attendance.models import AttendanceRecord
        month  = int(request.query_params.get('month', date.today().month))
        year   = int(request.query_params.get('year',  date.today().year))
        emp_id = request.query_params.get('employee')
        fmt    = request.query_params.get('format', 'json')

        qs = AttendanceRecord.objects.select_related(
            'employee', 'employee__profile', 'employee__profile__department'
        ).filter(date__year=year, date__month=month)
        if emp_id:
            qs = qs.filter(employee_id=emp_id)

        _, mdays = calendar.monthrange(year, month)
        wdays = sum(1 for d in range(1, mdays+1) if date(year, month, d).weekday() < 5)

        emp_map = {}
        for r in qs:
            eid = r.employee_id
            if eid not in emp_map:
                try:
                    ec   = r.employee.profile.emp_code
                    dept = r.employee.profile.department.name if r.employee.profile.department else '—'
                except Exception:
                    ec = ''; dept = '—'
                emp_map[eid] = {
                    'emp_id': eid, 'emp_code': ec,
                    'name': r.employee.get_full_name() or r.employee.username,
                    'dept': dept, 'role': r.employee.role,
                    'emp_type': r.employee.employee_type,
                    'present': 0, 'absent': 0, 'late': 0,
                    'half_day': 0, 'leave': 0, 'holiday': 0,
                    'ot_hours': 0.0, 'total_hours': 0.0,
                }
            d = emp_map[eid]
            s = r.status
            if s == 'present':   d['present']  += 1
            elif s == 'absent':  d['absent']   += 1
            elif s == 'late':    d['late']      += 1
            elif s == 'half_day': d['half_day'] += 1
            elif s == 'leave':   d['leave']     += 1
            elif s == 'holiday': d['holiday']   += 1
            d['ot_hours']    += float(r.ot_hours    or 0)
            d['total_hours'] += float(r.hours_worked or 0)

        data = list(emp_map.values())

        if fmt == 'csv':
            headers = ['Emp Code','Name','Department','Role','Type',
                       'Present','Absent','Late','Half Day','Leave','Holiday',
                       'Total Hours','OT Hours']
            rows = [[
                d['emp_code'], d['name'], d['dept'], d['role'], d['emp_type'],
                d['present'], d['absent'], d['late'], d['half_day'],
                d['leave'], d['holiday'],
                round(d['total_hours'],2), round(d['ot_hours'],2)
            ] for d in data]
            return csv_response(headers, rows, f'attendance_{month}_{year}.csv')

        return Response({'month': month, 'year': year, 'working_days': wdays, 'data': data})


class LeaveReportView(APIView):
    permission_classes = [make_permission('view_reports')]

    def get(self, request):
        from leave.models import LeaveRequest
        year   = int(request.query_params.get('year', date.today().year))
        status = request.query_params.get('status', 'approved')
        lt_id  = request.query_params.get('leave_type')
        fmt    = request.query_params.get('format', 'json')

        qs = LeaveRequest.objects.select_related(
            'employee', 'employee__profile',
            'leave_type', 'approved_by'
        ).filter(start_date__year=year, status=status)
        if lt_id:
            qs = qs.filter(leave_type_id=lt_id)

        data = []
        for lr in qs:
            try:
                ec   = lr.employee.profile.emp_code
                dept = lr.employee.profile.department.name if lr.employee.profile.department else '—'
            except Exception:
                ec = ''; dept = '—'
            data.append({
                'emp_code':   ec,
                'name':       lr.employee.get_full_name() or lr.employee.username,
                'department': dept,
                'leave_type': lr.leave_type.name,
                'leave_code': lr.leave_type.code,
                'is_paid':    lr.leave_type.is_paid,
                'start_date': str(lr.start_date),
                'end_date':   str(lr.end_date),
                'days':       float(lr.days),
                'status':     lr.status,
                'reason':     lr.reason,
                'approved_by': lr.approved_by.get_full_name() if lr.approved_by else '—',
                'applied_at': str(lr.applied_at.date()),
            })

        lt_summary = {}
        for d in data:
            code = d['leave_code']
            if code not in lt_summary:
                lt_summary[code] = {'name': d['leave_type'], 'total_days': 0, 'count': 0}
            lt_summary[code]['total_days'] += d['days']
            lt_summary[code]['count']      += 1

        if fmt == 'csv':
            headers = ['Emp Code','Name','Department','Leave Type','Paid',
                       'Start','End','Days','Status','Reason','Approved By','Applied On']
            rows = [[
                d['emp_code'], d['name'], d['department'],
                d['leave_type'], 'Yes' if d['is_paid'] else 'No',
                d['start_date'], d['end_date'], d['days'],
                d['status'], d['reason'], d['approved_by'], d['applied_at']
            ] for d in data]
            return csv_response(headers, rows, f'leave_report_{year}.csv')

        return Response({
            'year': year, 'status': status,
            'summary': list(lt_summary.values()),
            'data': data,
        })


class PayrollReportView(APIView):
    permission_classes = [make_permission('view_reports')]

    def get(self, request):
        from payroll.models import PayrollEntry
        month = int(request.query_params.get('month', date.today().month))
        year  = int(request.query_params.get('year',  date.today().year))
        fmt   = request.query_params.get('format', 'json')

        entries = PayrollEntry.objects.select_related(
            'employee', 'employee__profile',
            'employee__profile__department', 'payroll_run'
        ).filter(payroll_run__month=month, payroll_run__year=year)

        data = []
        for e in entries:
            try:
                ec   = e.employee.profile.emp_code
                dept = e.employee.profile.department.name if e.employee.profile.department else '—'
            except Exception:
                ec = ''; dept = '—'
            data.append({
                'emp_code':         ec,
                'name':             e.employee.get_full_name() or e.employee.username,
                'department':       dept,
                'emp_type':         e.employee.employee_type,
                'working_days':     int(e.working_days),
                'present_days':     float(e.present_days),
                'lop_days':         float(e.lop_days),
                'ot_hours':         float(e.ot_hours),
                'basic':            float(e.basic),
                'hra':              float(e.hra),
                'da':               float(e.da),
                'special':          float(e.special_allowance),
                'transport':        float(e.transport),
                'medical':          float(e.medical),
                'ot_pay':           float(e.ot_pay),
                'gross':            float(e.gross),
                'pf_employee':      float(e.pf_employee),
                'esi_employee':     float(e.esi_employee),
                'pt':               float(e.pt),
                'tds':              float(e.tds),
                'lop_deduction':    float(e.lop_deduction),
                'total_deductions': float(e.total_deductions),
                'net_pay':          float(e.net_pay),
                'run_status':       e.payroll_run.status,
            })

        totals = {
            'employees':        len(data),
            'gross':            sum(d['gross']            for d in data),
            'pf':               sum(d['pf_employee']      for d in data),
            'esi':              sum(d['esi_employee']      for d in data),
            'tds':              sum(d['tds']              for d in data),
            'lop_deduction':    sum(d['lop_deduction']    for d in data),
            'total_deductions': sum(d['total_deductions'] for d in data),
            'net_pay':          sum(d['net_pay']          for d in data),
            'with_lop':         sum(1 for d in data if d['lop_days'] > 0),
        }

        if fmt == 'csv':
            headers = ['Emp Code','Name','Department','Type',
                       'Working Days','Present','LOP Days','OT Hrs',
                       'Basic','HRA','DA','Special','Transport','Medical','OT Pay','Gross',
                       'PF','ESI','PT','TDS','LOP Deduct','Total Deduct','Net Pay']
            rows = [[
                d['emp_code'], d['name'], d['department'], d['emp_type'],
                d['working_days'], d['present_days'], d['lop_days'], d['ot_hours'],
                d['basic'], d['hra'], d['da'], d['special'],
                d['transport'], d['medical'], d['ot_pay'], d['gross'],
                d['pf_employee'], d['esi_employee'], d['pt'], d['tds'],
                d['lop_deduction'], d['total_deductions'], d['net_pay']
            ] for d in data]
            return csv_response(headers, rows, f'payroll_{month}_{year}.csv')

        return Response({'month': month, 'year': year, 'totals': totals, 'data': data})


class HeadcountReportView(APIView):
    permission_classes = [make_permission('view_reports')]

    def get(self, request):
        from accounts.models import User
        fmt = request.query_params.get('format', 'json')

        employees = User.objects.filter(is_active=True).select_related(
            'profile', 'profile__department'
        )

        by_dept = {}
        by_role = {}
        by_type = {}
        rows = []

        for emp in employees:
            try:
                ec     = emp.profile.emp_code
                dept   = emp.profile.department.name if emp.profile.department else 'Unassigned'
                desig  = emp.profile.designation
                joined = str(emp.profile.joining_date)
            except Exception:
                ec = ''; dept = 'Unassigned'; desig = '—'; joined = '—'

            by_dept[dept]           = by_dept.get(dept, 0)           + 1
            by_role[emp.role]       = by_role.get(emp.role, 0)       + 1
            by_type[emp.employee_type] = by_type.get(emp.employee_type, 0) + 1

            rows.append({
                'emp_code': ec, 'name': emp.get_full_name() or emp.username,
                'email': emp.email, 'role': emp.role,
                'emp_type': emp.employee_type, 'dept': dept,
                'desig': desig, 'joined': joined,
            })

        if fmt == 'csv':
            headers = ['Emp Code','Name','Email','Role','Type','Department','Designation','Joined']
            csv_rows = [[r['emp_code'],r['name'],r['email'],r['role'],
                         r['emp_type'],r['dept'],r['desig'],r['joined']] for r in rows]
            return csv_response(headers, csv_rows, 'headcount.csv')

        return Response({
            'total': len(rows),
            'by_department': by_dept,
            'by_role': by_role,
            'by_type': by_type,
            'employees': rows,
        })


class LopSummaryView(APIView):
    permission_classes = [make_permission('view_reports')]

    def get(self, request):
        from payroll.models import PayrollEntry
        month = int(request.query_params.get('month', date.today().month))
        year  = int(request.query_params.get('year',  date.today().year))
        fmt   = request.query_params.get('format', 'json')

        entries = PayrollEntry.objects.select_related(
            'employee', 'employee__profile', 'employee__profile__department'
        ).filter(
            payroll_run__month=month, payroll_run__year=year, lop_days__gt=0
        ).order_by('-lop_days')

        data = []
        for e in entries:
            try:
                ec   = e.employee.profile.emp_code
                dept = e.employee.profile.department.name if e.employee.profile.department else '—'
            except Exception:
                ec = ''; dept = '—'
            data.append({
                'emp_code':      ec,
                'name':          e.employee.get_full_name() or e.employee.username,
                'department':    dept,
                'lop_days':      float(e.lop_days),
                'lop_deduction': float(e.lop_deduction),
                'working_days':  int(e.working_days),
                'present_days':  float(e.present_days),
            })

        if fmt == 'csv':
            headers = ['Emp Code','Name','Department','LOP Days','LOP Deduction','Working Days','Present Days']
            rows = [[d['emp_code'],d['name'],d['department'],
                     d['lop_days'],d['lop_deduction'],d['working_days'],d['present_days']] for d in data]
            return csv_response(headers, rows, f'lop_summary_{month}_{year}.csv')

        return Response({
            'month': month, 'year': year,
            'total_employees_with_lop': len(data),
            'total_lop_days':      sum(d['lop_days']      for d in data),
            'total_lop_deduction': sum(d['lop_deduction'] for d in data),
            'data': data,
        })


class OvertimeReportView(APIView):
    permission_classes = [make_permission('view_reports')]

    def get(self, request):
        from payroll.models import PayrollEntry
        month = int(request.query_params.get('month', date.today().month))
        year  = int(request.query_params.get('year',  date.today().year))
        fmt   = request.query_params.get('format', 'json')

        entries = PayrollEntry.objects.select_related(
            'employee', 'employee__profile', 'employee__profile__department'
        ).filter(
            payroll_run__month=month, payroll_run__year=year, ot_hours__gt=0
        ).order_by('-ot_hours')

        data = []
        for e in entries:
            try:
                ec   = e.employee.profile.emp_code
                dept = e.employee.profile.department.name if e.employee.profile.department else '—'
            except Exception:
                ec = ''; dept = '—'
            data.append({
                'emp_code': ec,
                'name':     e.employee.get_full_name() or e.employee.username,
                'dept':     dept,
                'ot_hours': float(e.ot_hours),
                'ot_pay':   float(e.ot_pay),
                'gross':    float(e.gross),
                'net_pay':  float(e.net_pay),
            })

        if fmt == 'csv':
            headers = ['Emp Code','Name','Department','OT Hours','OT Pay','Gross','Net Pay']
            rows = [[d['emp_code'],d['name'],d['dept'],
                     d['ot_hours'],d['ot_pay'],d['gross'],d['net_pay']] for d in data]
            return csv_response(headers, rows, f'overtime_{month}_{year}.csv')

        return Response({
            'month': month, 'year': year,
            'total_employees_with_ot': len(data),
            'total_ot_hours': sum(d['ot_hours'] for d in data),
            'total_ot_pay':   sum(d['ot_pay']   for d in data),
            'data': data,
        })


class ReportsDashboardView(APIView):
    permission_classes = [make_permission('view_reports')]

    def get(self, request):
        from attendance.models import AttendanceRecord
        from leave.models import LeaveRequest
        from payroll.models import PayrollRun, PayrollEntry
        from accounts.models import User

        today = date.today()
        month = today.month
        year  = today.year

        att   = AttendanceRecord.objects.filter(date__year=year, date__month=month)
        leave = LeaveRequest.objects.filter(start_date__year=year, start_date__month=month)
        last_run = PayrollRun.objects.order_by('-year','-month').first()
        pe = PayrollEntry.objects.filter(payroll_run=last_run) if last_run else []

        return Response({
            'month': month, 'year': year,
            'attendance': {
                'total_records': att.count(),
                'present':  att.filter(status='present').count(),
                'absent':   att.filter(status='absent').count(),
                'late':     att.filter(status='late').count(),
                'on_leave': att.filter(status='leave').count(),
            },
            'leave': {
                'total_requests': leave.count(),
                'approved':  leave.filter(status='approved').count(),
                'pending':   leave.filter(status='pending').count(),
                'rejected':  leave.filter(status='rejected').count(),
            },
            'payroll': {
                'last_month':  last_run.month  if last_run else None,
                'last_year':   last_run.year   if last_run else None,
                'status':      last_run.status if last_run else None,
                'total_gross': float(sum(e.gross   for e in pe)),
                'total_net':   float(sum(e.net_pay for e in pe)),
                'employees':   len(pe),
            },
            'headcount': {
                'total_active': User.objects.filter(is_active=True).count(),
                'by_role': {
                    r: User.objects.filter(role=r, is_active=True).count()
                    for r in ['admin','manager','hr','employee']
                },
            },
        })