from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q

from .models import Lead, LeadForm, LeadField, LeadStatus
from .serializers import (
    LeadSerializer, LeadCreateSerializer, LeadUpdateSerializer,
    LeadFormSerializer, LeadFormCreateSerializer,
    LeadFieldSerializer, LeadFieldCreateSerializer, LeadFieldSerializer,
    FormFieldsSyncSerializer,
    FollowUpSerializer, FollowUpCreateSerializer, FollowUpUpdateSerializer,
)
from . import services
from .permissions import IsAdminUser, IsAdminOrCounselor
from accounts.models import User


# ─── Helper ───────────────────────────────────────────────────────────────────

def _is_admin(user):
    if user.is_superuser:
        return True
    role = getattr(user, 'role', None)
    if role is None:
        return False
    return str(role).lower() in ('admin', 'hr', 'manager')


# ─── Forms ────────────────────────────────────────────────────────────────────

class LeadFormListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        forms = services.get_forms()
        return Response(LeadFormSerializer(forms, many=True).data)

    def post(self, request):
        if not _is_admin(request.user):
            return Response({'detail': 'Admin only'}, status=403)
        serializer = LeadFormCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        form = services.create_form(serializer.validated_data)
        return Response(LeadFormSerializer(form).data, status=201)


class LeadFormFieldSyncView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, form_id):
        if not _is_admin(request.user):
            return Response({'detail': 'Admin only'}, status=403)
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
        if not _is_admin(request.user):
            return Response({'detail': 'Admin only'}, status=403)
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
        if not _is_admin(request.user):
            return Response({'detail': 'Admin only'}, status=403)
        serializer = LeadFieldSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        field = services.update_field(field_id, serializer.validated_data)
        if not field:
            return Response({'detail': 'Field not found'}, status=404)
        return Response(LeadFieldSerializer(field).data)

    def delete(self, request, field_id):
        if not _is_admin(request.user):
            return Response({'detail': 'Admin only'}, status=403)
        if not services.delete_field(field_id):
            return Response({'detail': 'Field not found'}, status=404)
        return Response(status=204)


# ─── Leads ────────────────────────────────────────────────────────────────────

class LeadListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 100))
        tenant_id = getattr(request.user, 'tenant_id', None)

        if _is_admin(request.user):
            leads = services.get_leads(skip=skip, limit=limit, tenant_id=tenant_id)
        else:
            leads = services.get_leads(
                skip=skip, limit=limit,
                counselor_id=request.user.id,
                tenant_id=tenant_id
            )
        return Response(LeadSerializer(leads, many=True).data)

    def post(self, request):
        serializer = LeadCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        # Counselors are auto-assigned to themselves
        if not _is_admin(request.user):
            data['counselor_id'] = request.user.id

        # Attach tenant
        tenant_id = getattr(request.user, 'tenant_id', None)
        if tenant_id:
            data['tenant_id'] = tenant_id

        lead = services.create_lead(data)
        return Response(LeadSerializer(lead).data, status=201)


class LeadDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, lead_id):
        lead = services.get_lead(lead_id)
        if not lead:
            return Response({'detail': 'Lead not found'}, status=404)
        if not _is_admin(request.user) and lead.counselor_id != request.user.id:
            return Response({'detail': 'Not enough privileges'}, status=403)
        return Response(LeadSerializer(lead).data)

    def put(self, request, lead_id):
        lead = services.get_lead(lead_id)
        if not lead:
            return Response({'detail': 'Lead not found'}, status=404)
        if not _is_admin(request.user) and lead.counselor_id != request.user.id:
            return Response({'detail': 'Not enough privileges'}, status=403)

        serializer = LeadUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = services.update_lead(lead_id, dict(serializer.validated_data))
        return Response(LeadSerializer(updated).data)

    def delete(self, request, lead_id):
        if not _is_admin(request.user):
            return Response({'detail': 'Admin only'}, status=403)
        if not services.delete_lead(lead_id):
            return Response({'detail': 'Lead not found'}, status=404)
        return Response(status=204)


class LeadAssignCounselorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, lead_id, counselor_id):
        if not _is_admin(request.user):
            return Response({'detail': 'Admin only'}, status=403)
        lead = services.assign_counselor(lead_id, counselor_id)
        if not lead:
            return Response({'detail': 'Lead not found'}, status=404)
        return Response(LeadSerializer(lead).data)


# ─── FollowUps ────────────────────────────────────────────────────────────────

class FollowUpListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lead_id = request.query_params.get('lead_id')
        if _is_admin(request.user):
            followups = services.get_followups(lead_id=lead_id)
        else:
            followups = services.get_followups(
                lead_id=lead_id, counselor_id=request.user.id
            )
        return Response(FollowUpSerializer(followups, many=True).data)

    def post(self, request):
        serializer = FollowUpCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        followup = services.create_followup(
            dict(serializer.validated_data), counselor_id=request.user.id
        )
        return Response(FollowUpSerializer(followup).data, status=201)


class FollowUpDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, followup_id):
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
        if not _is_admin(request.user):
            return Response({'detail': 'Admin only'}, status=403)

        tenant_id = getattr(request.user, 'tenant_id', None)
        qs = Lead.objects.all()
        if tenant_id:
            qs = qs.filter(tenant_id=tenant_id)

        total_leads = qs.count()
        status_counts = dict(
            qs.values_list('status').annotate(count=Count('id'))
        )
        confirmed = qs.filter(status=LeadStatus.ADMISSION_CONFIRMED).count()
        conversion_rate = (confirmed / total_leads * 100) if total_leads > 0 else 0

        counselor_perf_qs = (
            User.objects.filter(assigned_leads__isnull=False)
            .annotate(
                total_assigned=Count('assigned_leads'),
                confirmed_count=Count(
                    'assigned_leads',
                    filter=Q(assigned_leads__status=LeadStatus.ADMISSION_CONFIRMED)
                )
            )
            .values('full_name', 'total_assigned', 'confirmed_count')
            .distinct()
        )

        counselor_performance = [
            {
                'name': row['full_name'],
                'total_assigned': row['total_assigned'],
                'confirmed': row['confirmed_count'],
                'performance_ratio': (
                    row['confirmed_count'] / row['total_assigned'] * 100
                    if row['total_assigned'] > 0 else 0
                ),
            }
            for row in counselor_perf_qs
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
        users = User.objects.filter(is_active=True).values('id', 'full_name', 'email')
        return Response(list(users))