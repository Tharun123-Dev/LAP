# affiliate/serializers.py
from rest_framework import serializers
from .models import Affiliate, Referral, Commission, Payment, AffiliateNotification


class AffiliateProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    pending_earnings = serializers.FloatField(read_only=True)

    class Meta:
        model = Affiliate
        fields = [
            'id', 'full_name', 'email', 'referral_code',
            'phone', 'address', 'bank_account_details',
            'bank_name', 'account_number', 'payout_method', 'upi_id',
            'profile_image_url', 'total_earnings', 'paid_earnings',
            'pending_earnings', 'total_clicks', 'active_campaigns', 'created_at',
        ]
        read_only_fields = [
            'id', 'referral_code', 'total_earnings', 'paid_earnings',
            'total_clicks', 'active_campaigns', 'created_at'
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_email(self, obj):
        return obj.user.email


class AffiliateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Affiliate
        fields = [
            'phone', 'address', 'bank_account_details',
            'bank_name', 'account_number', 'payout_method', 'upi_id',
            'profile_image_url',
        ]


class AffiliateRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50, required=False, default='')
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    bank_account_details = serializers.CharField(required=False, allow_blank=True)
    bank_name = serializers.CharField(required=False, allow_blank=True)
    account_number = serializers.CharField(required=False, allow_blank=True)
    payout_method = serializers.CharField(required=False, default='ACH/Direct Deposit')
    upi_id = serializers.CharField(required=False, allow_blank=True)


class ReferralSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referral
        fields = [
            'id', 'affiliate', 'customer_name', 'customer_email',
            'status', 'purchase_amount', 'referred_at'
        ]
        read_only_fields = ['id', 'affiliate', 'referred_at']


class CommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Commission
        fields = [
            'id', 'referral', 'affiliate', 'amount',
            'status', 'payment_date', 'created_at'
        ]
        read_only_fields = ['id', 'affiliate', 'created_at']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'affiliate', 'amount', 'payment_method',
            'transaction_id', 'status', 'paid_at'
        ]
        read_only_fields = ['id', 'affiliate', 'paid_at']


class AffiliateNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AffiliateNotification
        fields = ['id', 'affiliate', 'type', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'affiliate', 'created_at']