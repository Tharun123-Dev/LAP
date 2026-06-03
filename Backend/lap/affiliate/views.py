# affiliate/views.py
from datetime import timedelta
from django.db.models import Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Affiliate, Referral, Commission, Payment,
    AffiliateNotification, generate_referral_code
)
from .serializers import (
    AffiliateProfileSerializer, AffiliateUpdateSerializer,
    AffiliateRegisterSerializer, ReferralSerializer,
    CommissionSerializer, PaymentSerializer, AffiliateNotificationSerializer,
)


def get_affiliate_or_404(request):
    try:
        return request.user.affiliate_profile
    except Affiliate.DoesNotExist:
        return None


# ─── AUTH ─────────────────────────────────────────────────────────────────────

class AffiliateRegisterView(APIView):
    """
    POST /api/affiliate/auth/register/
    Registers a new LAP user + creates their affiliate profile in one step.
    Login uses existing LAP endpoint: POST /api/auth/login/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        serializer = AffiliateRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        email = data['email']

        if User.objects.filter(email=email).exists():
            return Response(
                {'detail': 'A user with this email already exists.'},
                status=400
            )

        full_name = f"{data['first_name']} {data.get('last_name', '')}".strip()

        user = User.objects.create_user(
            username=email,
            email=email,
            password=data['password'],
            first_name=data['first_name'],
            last_name=data.get('last_name', ''),
            role='employee',
        )

        code = generate_referral_code(full_name)
        while Affiliate.objects.filter(referral_code=code).exists():
            code = generate_referral_code(full_name)

        affiliate = Affiliate.objects.create(
            user=user,
            referral_code=code,
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            bank_account_details=data.get('bank_account_details', ''),
            bank_name=data.get('bank_name', ''),
            account_number=data.get('account_number', ''),
            payout_method=data.get('payout_method', 'ACH/Direct Deposit'),
            upi_id=data.get('upi_id', ''),
            profile_image_url=(
                f"https://ui-avatars.com/api/?name="
                f"{full_name.replace(' ', '+')}&background=random"
            ),
        )

        return Response(
            AffiliateProfileSerializer(affiliate).data,
            status=status.HTTP_201_CREATED
        )


# ─── PROFILE ──────────────────────────────────────────────────────────────────

class AffiliateProfileView(APIView):
    """
    GET  /api/affiliate/profile/
    PUT  /api/affiliate/profile/
    PATCH /api/affiliate/profile/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        affiliate = get_affiliate_or_404(request)
        if not affiliate:
            return Response({'detail': 'Affiliate profile not found.'}, status=404)
        return Response(AffiliateProfileSerializer(affiliate).data)

    def put(self, request):
        affiliate = get_affiliate_or_404(request)
        if not affiliate:
            return Response({'detail': 'Affiliate profile not found.'}, status=404)
        serializer = AffiliateUpdateSerializer(affiliate, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(AffiliateProfileSerializer(affiliate).data)
        return Response(serializer.errors, status=400)

    def patch(self, request):
        return self.put(request)


# ─── REFERRALS ────────────────────────────────────────────────────────────────

class ReferralListView(APIView):
    """GET /api/affiliate/referrals/?status=pending&skip=0&limit=100"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        affiliate = get_affiliate_or_404(request)
        if not affiliate:
            return Response({'detail': 'Affiliate profile not found.'}, status=404)

        qs = Referral.objects.filter(affiliate=affiliate)
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 100))

        return Response(ReferralSerializer(qs[skip:skip + limit], many=True).data)


class ReferralDetailView(APIView):
    """GET /api/affiliate/referrals/<uuid:pk>/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        affiliate = get_affiliate_or_404(request)
        if not affiliate:
            return Response({'detail': 'Affiliate profile not found.'}, status=404)
        try:
            referral = Referral.objects.get(pk=pk, affiliate=affiliate)
        except Referral.DoesNotExist:
            return Response({'detail': 'Referral not found.'}, status=404)
        return Response(ReferralSerializer(referral).data)


class RegisterCustomerView(APIView):
    """
    POST /api/affiliate/referrals/register-customer/
    PUBLIC endpoint — called when a customer clicks a referral link.
    No auth required.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        referral_code = request.data.get('referral_code')
        customer_name = request.data.get('customer_name')
        customer_email = request.data.get('customer_email')
        product_name = request.data.get('product_name', '')
        purchase_amount = float(request.data.get('purchase_amount', 0.0))

        if not all([referral_code, customer_name, customer_email]):
            return Response(
                {'detail': 'referral_code, customer_name and customer_email are required.'},
                status=400
            )

        try:
            affiliate = Affiliate.objects.get(referral_code=referral_code)
        except Affiliate.DoesNotExist:
            return Response({'detail': 'Invalid referral code.'}, status=404)

        if Referral.objects.filter(customer_email=customer_email).exists():
            return Response({'detail': 'Customer email already registered.'}, status=400)

        ref_status = 'converted' if purchase_amount > 0.0 else 'pending'
        referral = Referral.objects.create(
            affiliate=affiliate,
            customer_name=customer_name,
            customer_email=customer_email,
            status=ref_status,
            purchase_amount=purchase_amount,
        )

        if purchase_amount > 0.0:
            commission_amount = round(purchase_amount * 0.10, 2)
            Commission.objects.create(
                referral=referral,
                affiliate=affiliate,
                amount=commission_amount,
                status='pending',
            )
            affiliate.total_earnings += commission_amount
            affiliate.save(update_fields=['total_earnings'])

            AffiliateNotification.objects.create(
                affiliate=affiliate,
                type='referral',
                message=(
                    f"New Conversion! {customer_name} subscribed to {product_name}. "
                    f"Commission of ₹{commission_amount:.2f} credited."
                ),
            )
        else:
            AffiliateNotification.objects.create(
                affiliate=affiliate,
                type='referral',
                message=f"New Lead! {customer_name} registered using your referral link.",
            )

        return Response({'status': 'success', 'message': 'Customer registered successfully.'})


# ─── COMMISSIONS ──────────────────────────────────────────────────────────────

class CommissionListView(APIView):
    """GET /api/affiliate/commissions/?status=pending"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        affiliate = get_affiliate_or_404(request)
        if not affiliate:
            return Response({'detail': 'Affiliate profile not found.'}, status=404)

        qs = Commission.objects.filter(affiliate=affiliate)
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 100))

        return Response(CommissionSerializer(qs[skip:skip + limit], many=True).data)


# ─── PAYMENTS ─────────────────────────────────────────────────────────────────

class PaymentListView(APIView):
    """GET /api/affiliate/payments/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        affiliate = get_affiliate_or_404(request)
        if not affiliate:
            return Response({'detail': 'Affiliate profile not found.'}, status=404)

        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 100))
        payments = Payment.objects.filter(affiliate=affiliate)[skip:skip + limit]

        return Response(PaymentSerializer(payments, many=True).data)


# ─── ANALYTICS ────────────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    """GET /api/affiliate/analytics/dashboard-stats/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        affiliate = get_affiliate_or_404(request)
        if not affiliate:
            return Response({'detail': 'Affiliate profile not found.'}, status=404)

        total_referrals = Referral.objects.filter(affiliate=affiliate).count()
        converted = Referral.objects.filter(affiliate=affiliate, status='converted').count()
        conversion_rate = round((converted / total_referrals * 100), 2) if total_referrals > 0 else 0.0

        now = timezone.now()
        first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly = Commission.objects.filter(
            affiliate=affiliate,
            created_at__gte=first_day
        ).aggregate(total=Sum('amount'))['total'] or 0.0

        return Response({
            'total_earnings': affiliate.total_earnings,
            'pending_earnings': affiliate.pending_earnings,
            'paid_earnings': affiliate.paid_earnings,
            'total_clicks': affiliate.total_clicks,
            'total_referrals': total_referrals,
            'conversion_rate': conversion_rate,
            'active_campaigns': affiliate.active_campaigns,
            'this_month_earnings': monthly,
        })


class ReferralGrowthView(APIView):
    """GET /api/affiliate/analytics/referral-growth/ — last 7 days"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        affiliate = get_affiliate_or_404(request)
        if not affiliate:
            return Response({'detail': 'Affiliate profile not found.'}, status=404)

        stats = []
        for i in range(6, -1, -1):
            day = (timezone.now() - timedelta(days=i)).date()
            count = Referral.objects.filter(
                affiliate=affiliate,
                referred_at__date=day,
            ).count()
            stats.append({'date': day.strftime('%b %d'), 'referrals': count})
        return Response(stats)


class EarningsPerformanceView(APIView):
    """GET /api/affiliate/analytics/earnings-performance/ — last 6 months"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        affiliate = get_affiliate_or_404(request)
        if not affiliate:
            return Response({'detail': 'Affiliate profile not found.'}, status=404)

        stats = []
        now = timezone.now()
        for i in range(5, -1, -1):
            month_date = now - timedelta(days=i * 30)
            amount = Commission.objects.filter(
                affiliate=affiliate,
                created_at__month=month_date.month,
                created_at__year=month_date.year,
            ).aggregate(total=Sum('amount'))['total'] or 0.0
            stats.append({'month': month_date.strftime('%b'), 'earnings': amount})
        return Response(stats)


# ─── NOTIFICATIONS (affiliate-specific) ──────────────────────────────────────

class AffiliateNotificationListView(APIView):
    """GET /api/affiliate/notifications/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        affiliate = get_affiliate_or_404(request)
        if not affiliate:
            return Response({'detail': 'Affiliate profile not found.'}, status=404)

        skip = int(request.query_params.get('skip', 0))
        limit = int(request.query_params.get('limit', 50))
        notifs = AffiliateNotification.objects.filter(affiliate=affiliate)[skip:skip + limit]
        return Response(AffiliateNotificationSerializer(notifs, many=True).data)


class MarkNotificationReadView(APIView):
    """PUT /api/affiliate/notifications/<uuid:pk>/read/"""
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        affiliate = get_affiliate_or_404(request)
        if not affiliate:
            return Response({'detail': 'Affiliate profile not found.'}, status=404)
        try:
            notif = AffiliateNotification.objects.get(pk=pk, affiliate=affiliate)
            notif.is_read = True
            notif.save(update_fields=['is_read'])
        except AffiliateNotification.DoesNotExist:
            return Response({'detail': 'Notification not found.'}, status=404)
        return Response({'msg': 'Marked as read'})


class MarkAllNotificationsReadView(APIView):
    """PUT /api/affiliate/notifications/read-all/"""
    permission_classes = [IsAuthenticated]

    def put(self, request):
        affiliate = get_affiliate_or_404(request)
        if not affiliate:
            return Response({'detail': 'Affiliate profile not found.'}, status=404)
        AffiliateNotification.objects.filter(
            affiliate=affiliate, is_read=False
        ).update(is_read=True)
        return Response({'msg': 'All marked as read'})