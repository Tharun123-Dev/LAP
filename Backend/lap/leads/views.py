from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q

from .models import Lead, LeadForm, LeadField, LeadStatus, FollowUp, LeadOption
from .serializers import (
    LeadSerializer, LeadCreateSerializer, LeadUpdateSerializer,
    LeadFormSerializer, LeadFormCreateSerializer,
    LeadFieldSerializer, LeadFieldCreateSerializer, LeadFieldSerializer,
    FormFieldsSyncSerializer,
    FollowUpSerializer, FollowUpCreateSerializer, FollowUpUpdateSerializer,
    LeadOptionSerializer,
)
from . import services
from .permissions import IsAdminUser, IsAdminOrCounselor
from accounts.models import User
from notifications.utils import notify_permission, notify_user


# ─── Helper ───────────────────────────────────────────────────────────────────

def _is_admin(user):
    if user.is_superuser:
        return True
    role = getattr(user, 'role', None)
    if role is None:
        return False
    return str(role).lower() in ('admin', 'hr', 'manager')


def _has_perm(user, code):
    return bool(user and user.is_authenticated and user.has_perm_code(code))


def _has_any_perm(user, *codes):
    return any(_has_perm(user, code) for code in codes)


def _denied():
    return Response({'detail': 'Permission denied'}, status=403)


def _same_tenant(user, lead):
    tenant_id = getattr(user, 'tenant_id', None)
    return not tenant_id or lead.tenant_id == tenant_id


def _can_access_lead(user, lead):
    if not _same_tenant(user, lead):
        return False
    if _has_perm(user, 'assign_lead'):
        return True
    return lead.counselor_id == user.id


def _can_view_all_leads(user):
    return _has_perm(user, 'assign_lead')


def _lead_name(lead):
    return lead.full_name or f'Lead #{lead.id}'


DEFAULT_LEAD_OPTIONS = [
    ('status', 'New', 'New', 10),
    ('status', 'Contacted', 'Contacted', 20),
    ('status', 'Interested', 'Interested', 30),
    ('status', 'Follow-Up Pending', 'Follow-Up Pending', 40),
    ('status', 'Admission Confirmed', 'Admission Confirmed', 50),
    ('status', 'Rejected', 'Rejected', 60),
    ('contact_method', 'Phone Call', 'Call', 10),
    ('contact_method', 'WhatsApp', 'WhatsApp', 20),
    ('contact_method', 'Email', 'Email', 30),
    ('contact_method', 'Meeting Visit', 'Meeting', 40),
]


def _tenant_id(user):
    return getattr(user, 'tenant_id', None) or 'default'


def _ensure_default_lead_options(tenant_id):
    for category, label, value, sort_order in DEFAULT_LEAD_OPTIONS:
        LeadOption.objects.get_or_create(
            tenant_id=tenant_id,
            category=category,
            value=value,
            defaults={
                'label': label,
                'sort_order': sort_order,
                'is_active': True,
                'is_system': True,
            },
        )


def _group_lead_options(tenant_id):
    _ensure_default_lead_options(tenant_id)
    options = LeadOption.objects.filter(tenant_id=tenant_id, is_active=True)
    return {
        'statuses': LeadOptionSerializer(options.filter(category='status'), many=True).data,
        'contact_methods': LeadOptionSerializer(options.filter(category='contact_method'), many=True).data,
    }


def _notify_lead_created(lead, actor):
    name = _lead_name(lead)
    notify_permission(
        perm_code='assign_lead',
        title=f'New Lead Submitted: {name}',
        body=f'{name} has been submitted and is ready for counselor assignment.',
        notif_type='general',
        exclude_user=actor,
    )
    if lead.counselor:
        notify_user(
            lead.counselor,
            title=f'New Lead Assigned: {name}',
            body=f'{name} has been assigned to you. Open Leads to review the student details and start follow ups.',
            notif_type='general',
        )


def _notify_lead_assigned(lead, actor):
    if not lead.counselor:
        return
    name = _lead_name(lead)
    actor_name = actor.get_full_name() or actor.username
    notify_user(
        lead.counselor,
        title=f'Lead Assigned: {name}',
        body=f'{actor_name} assigned {name} to you. Open the lead to view details and tracking.',
        notif_type='general',
    )


def _notify_admission_confirmed(lead, actor):
    name = _lead_name(lead)
    amount = lead.revenue_amount or 0
    notify_permission(
        perm_code='view_revenue',
        title=f'Admission Confirmed: {name}',
        body=f'{name} is confirmed. Revenue amount: {amount}. Check Revenue for payment details.',
        notif_type='general',
        exclude_user=actor,
    )
    notify_permission(
        perm_code='assign_lead',
        title=f'Lead Converted: {name}',
        body=f'{name} moved to Admission Confirmed. Revenue amount: {amount}.',
        notif_type='general',
        exclude_user=actor,
    )


# ─── Forms ────────────────────────────────────────────────────────────────────

class LeadFormListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _has_any_perm(request.user, 'view_leads', 'create_lead', 'manage_lead_forms'):
            return _denied()
        forms = services.get_forms()
        return Response(LeadFormSerializer(forms, many=True).data)

    def post(self, request):
        if not _has_perm(request.user, 'manage_lead_forms'):
            return _denied()
        serializer = LeadFormCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        form = services.create_form(serializer.validated_data)
        return Response(LeadFormSerializer(form).data, status=201)


class LeadFormFieldSyncView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, form_id):
        if not _has_perm(request.user, 'manage_lead_forms'):
            return _denied()
        form = services.get_form(form_id)
        if not form:
            return Response({'detail': 'Form not found'}, status=404)
        serializer = FormFieldsSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.sync_fields(form_id, serializer.validated_data['fields'])
        form.refresh_from_db()
        return Response(LeadFormSerializer(form).data)


class LeadFieldListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _has_perm(request.user, 'manage_lead_forms'):
            return _denied()
        form_id = request.query_params.get('form_id')
        if not form_id:
            return Response({'detail': 'form_id query param required'}, status=400)
        serializer = LeadFieldCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        field = services.add_field(int(form_id), serializer.validated_data)
        return Response(LeadFieldSerializer(field).data, status=201)


class LeadFieldDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, field_id):
        if not _has_perm(request.user, 'manage_lead_forms'):
            return _denied()
        serializer = LeadFieldSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        field = services.update_field(field_id, serializer.validated_data)
        if not field:
            return Response({'detail': 'Field not found'}, status=404)
        return Response(LeadFieldSerializer(field).data)

    def delete(self, request, field_id):
        if not _has_perm(request.user, 'manage_lead_forms'):
            return _denied()
        if not services.delete_field(field_id):
            return Response({'detail': 'Field not found'}, status=404)
        return Response(status=204)


class LeadOptionListSaveView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _has_any_perm(
            request.user,
            'view_leads',
            'create_lead',
            'view_followups',
            'create_followup',
            'manage_lead_forms',
        ):
            return _denied()
        return Response(_group_lead_options(_tenant_id(request.user)))

    def put(self, request):
        if not _has_perm(request.user, 'manage_lead_forms'):
            return _denied()

        tenant_id = _tenant_id(request.user)
        category_map = {
            'statuses': 'status',
            'contact_methods': 'contact_method',
        }

        for payload_key, category in category_map.items():
            incoming = request.data.get(payload_key, [])
            LeadOption.objects.filter(tenant_id=tenant_id, category=category).update(is_active=False)

            for index, item in enumerate(incoming):
                if isinstance(item, str):
                    item = {'label': item, 'value': item}
                label = str(item.get('label') or item.get('value') or '').strip()
                value = str(item.get('value') or label).strip()
                if not label or not value:
                    continue

                defaults = {
                    'label': label,
                    'color': item.get('color', ''),
                    'sort_order': item.get('sort_order', index + 1),
                    'is_active': True,
                }
                option = None
                if item.get('id'):
                    option = LeadOption.objects.filter(
                        id=item.get('id'),
                        tenant_id=tenant_id,
                        category=category,
                    ).first()

                if option:
                    option.label = defaults['label']
                    option.value = value
                    option.color = defaults['color']
                    option.sort_order = defaults['sort_order']
                    option.is_active = True
                    option.save()
                else:
                    LeadOption.objects.update_or_create(
                        tenant_id=tenant_id,
                        category=category,
                        value=value,
                        defaults=defaults,
                    )

        return Response(_group_lead_options(tenant_id))


# ─── Leads ────────────────────────────────────────────────────────────────────

class LeadListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _has_perm(request.user, 'view_leads'):
            return _denied()
        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 100))
        tenant_id = getattr(request.user, 'tenant_id', None)

        if _can_view_all_leads(request.user):
            leads = services.get_leads(skip=skip, limit=limit, tenant_id=tenant_id)
        else:
            leads = services.get_leads(
                skip=skip, limit=limit,
                counselor_id=request.user.id,
                tenant_id=tenant_id
            )
        return Response(LeadSerializer(leads, many=True).data)

    def post(self, request):
        if not _has_perm(request.user, 'create_lead'):
            return _denied()
        serializer = LeadCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        # Counselors are auto-assigned to themselves
        if not _has_perm(request.user, 'assign_lead'):
            data['counselor_id'] = request.user.id

        # Attach tenant
        tenant_id = getattr(request.user, 'tenant_id', None)
        if tenant_id:
            data['tenant_id'] = tenant_id

        lead = services.create_lead(data)
        _notify_lead_created(lead, request.user)
        return Response(LeadSerializer(lead).data, status=201)


class LeadDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, lead_id):
        if not _has_perm(request.user, 'view_leads'):
            return _denied()
        lead = services.get_lead(lead_id)
        if not lead:
            return Response({'detail': 'Lead not found'}, status=404)
        if not _can_access_lead(request.user, lead):
            return Response({'detail': 'Not enough privileges'}, status=403)
        return Response(LeadSerializer(lead).data)

    def put(self, request, lead_id):
        if not _has_perm(request.user, 'edit_lead'):
            return _denied()
        lead = services.get_lead(lead_id)
        if not lead:
            return Response({'detail': 'Lead not found'}, status=404)
        if not _can_access_lead(request.user, lead):
            return Response({'detail': 'Not enough privileges'}, status=403)
        old_status = lead.status

        serializer = LeadUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        if not _has_perm(request.user, 'assign_lead'):
            data.pop('counselor_id', None)
        updated = services.update_lead(lead_id, data)
        if old_status != 'Admission Confirmed' and updated.status == 'Admission Confirmed':
            _notify_admission_confirmed(updated, request.user)
        return Response(LeadSerializer(updated).data)

    def delete(self, request, lead_id):
        if not _has_perm(request.user, 'delete_lead'):
            return _denied()
        lead = services.get_lead(lead_id)
        if not lead:
            return Response({'detail': 'Lead not found'}, status=404)
        if not _same_tenant(request.user, lead):
            return Response({'detail': 'Not enough privileges'}, status=403)
        if not services.delete_lead(lead_id):
            return Response({'detail': 'Lead not found'}, status=404)
        return Response(status=204)


class LeadAssignCounselorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, lead_id, counselor_id):
        if not _has_perm(request.user, 'assign_lead'):
            return _denied()
        counselor = User.objects.filter(id=counselor_id, is_active=True, role='counselor').first()
        if not counselor:
            return Response({'detail': 'Counselor not found'}, status=404)
        lead = services.get_lead(lead_id)
        if not lead:
            return Response({'detail': 'Lead not found'}, status=404)
        if not _same_tenant(request.user, lead) or getattr(counselor, 'tenant_id', None) != lead.tenant_id:
            return Response({'detail': 'Not enough privileges'}, status=403)
        lead = services.assign_counselor(lead_id, counselor_id)
        _notify_lead_assigned(lead, request.user)
        return Response(LeadSerializer(lead).data)


# ─── FollowUps ────────────────────────────────────────────────────────────────

class FollowUpListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _has_perm(request.user, 'view_followups'):
            return _denied()
        lead_id = request.query_params.get('lead_id')
        if _can_view_all_leads(request.user):
            followups = services.get_followups(lead_id=lead_id)
        else:
            followups = services.get_followups(
                lead_id=lead_id, counselor_id=request.user.id
            )
        return Response(FollowUpSerializer(followups, many=True).data)

    def post(self, request):
        if not _has_perm(request.user, 'create_followup'):
            return _denied()
        serializer = FollowUpCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = services.get_lead(serializer.validated_data['lead_id'])
        if not lead:
            return Response({'detail': 'Lead not found'}, status=404)
        if not _can_access_lead(request.user, lead):
            return Response({'detail': 'Only the assigned counselor can add follow ups'}, status=403)
        followup = services.create_followup(
            dict(serializer.validated_data), counselor_id=request.user.id
        )
        return Response(FollowUpSerializer(followup).data, status=201)


class FollowUpDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, followup_id):
        if not _has_any_perm(request.user, 'create_followup', 'edit_lead'):
            return _denied()
        existing = FollowUp.objects.select_related('lead').filter(id=followup_id).first()
        if not existing:
            return Response({'detail': 'FollowUp not found'}, status=404)
        if not _can_access_lead(request.user, existing.lead):
            return Response({'detail': 'Not enough privileges'}, status=403)
        serializer = FollowUpUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        followup = services.update_followup(followup_id, dict(serializer.validated_data))
        if not followup:
            return Response({'detail': 'FollowUp not found'}, status=404)
        return Response(FollowUpSerializer(followup).data)


# ─── Analytics ────────────────────────────────────────────────────────────────

class LeadDashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _has_perm(request.user, 'view_lead_analytics'):
            return _denied()

        tenant_id = getattr(request.user, 'tenant_id', None)
        qs = Lead.objects.all()
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        if not _can_view_all_leads(request.user):
            qs = qs.filter(counselor_id=request.user.id)

        total_leads = qs.count()
        status_counts = dict(
            qs.values_list('status').annotate(count=Count('id'))
        )
        confirmed = qs.filter(status=LeadStatus.ADMISSION_CONFIRMED).count()
        conversion_rate = (confirmed / total_leads * 100) if total_leads > 0 else 0

        counselor_perf_qs = (
            User.objects.filter(assigned_leads__isnull=False)
            .filter(assigned_leads__tenant_id=tenant_id) if tenant_id else
            User.objects.filter(assigned_leads__isnull=False)
        )
        if not _can_view_all_leads(request.user):
            counselor_perf_qs = counselor_perf_qs.filter(id=request.user.id)
        counselor_perf_qs = (
            counselor_perf_qs
            .annotate(
                total_assigned=Count('assigned_leads'),
                confirmed_count=Count(
                    'assigned_leads',
                    filter=Q(assigned_leads__status=LeadStatus.ADMISSION_CONFIRMED)
                )
            )
            .distinct()
        )

        counselor_performance = [
            {
                'name': user.get_full_name() or user.username,
                'total_assigned': user.total_assigned,
                'confirmed': user.confirmed_count,
                'performance_ratio': (
                    user.confirmed_count / user.total_assigned * 100
                    if user.total_assigned > 0 else 0
                ),
            }
            for user in counselor_perf_qs
        ]

        return Response({
            'total_leads': total_leads,
            'status_distribution': status_counts,
            'conversion_rate': conversion_rate,
            'counselor_performance': counselor_performance,
        })


# ─── Users (counselors list for frontend dropdowns) ───────────────────────────

class LeadUsersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _has_any_perm(request.user, 'view_leads', 'create_lead', 'assign_lead', 'create_followup'):
            return _denied()
        users = User.objects.filter(is_active=True, role='counselor')
        return Response([
            {
                'id': user.id,
                'full_name': user.get_full_name() or user.username,
                'email': user.email,
                'role': user.role,
            }
            for user in users
        ])


class RevenueOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _has_perm(request.user, 'view_revenue'):
            return _denied()

        tenant_id = getattr(request.user, 'tenant_id', None)
        qs = Lead.objects.select_related('counselor').prefetch_related('field_values__field')
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)
        if not _can_view_all_leads(request.user):
            qs = qs.filter(counselor_id=request.user.id)

        def get_field_value(lead, accepted_labels):
            labels = {label.lower() for label in accepted_labels}
            for value in lead.field_values.all():
                label = (value.field.label or '').strip().lower()
                if label in labels:
                    return value.value
            return None

        def field_amount(lead):
            if lead.revenue_amount:
                return float(lead.revenue_amount)
            raw_value = get_field_value(lead, {
                'revenue', 'fee', 'course fee', 'amount',
                'admission fee', 'paid amount', 'total fee', 'payment amount'
            })
            if raw_value is not None:
                raw = ''.join(ch for ch in str(raw_value) if ch.isdigit() or ch == '.')
                try:
                    return float(raw or 0)
                except ValueError:
                    return 0
            return 0

        def lead_row(lead):
            return {
                'id': lead.id,
                'full_name': lead.full_name,
                'email': lead.email,
                'phone': lead.phone,
                'status': lead.status,
                'amount': field_amount(lead),
                'payment_status': lead.payment_status,
                'payment_reference': lead.payment_reference,
                'course': get_field_value(lead, {
                    'course', 'course of interest', 'program', 'program of interest'
                }) or '',
                'counselor': (
                    lead.counselor.get_full_name() or lead.counselor.username
                    if lead.counselor else 'Unassigned'
                ),
                'confirmed_at': lead.updated_at,
            }

        confirmed = [lead for lead in qs if lead.status == LeadStatus.ADMISSION_CONFIRMED]
        pipeline = [lead for lead in qs if lead.status in ('Interested', 'Follow-Up Pending')]

        confirmed_revenue = sum(field_amount(lead) for lead in confirmed)
        pipeline_revenue = sum(field_amount(lead) for lead in pipeline)
        total = qs.count()

        return Response({
            'confirmed_revenue': confirmed_revenue,
            'pipeline_revenue': pipeline_revenue,
            'confirmed_count': len(confirmed),
            'pipeline_count': len(pipeline),
            'conversion_rate': round((len(confirmed) / total) * 100) if total else 0,
            'confirmed_leads': [lead_row(lead) for lead in confirmed],
            'pipeline_leads': [lead_row(lead) for lead in pipeline],
        })
