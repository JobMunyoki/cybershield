from rest_framework import serializers
from .models import Asset, Incident, Vulnerability, AuditLog
from django.contrib.auth.models import User
from .models import (
    Asset,
    Incident,
    Vulnerability,
    AuditLog,
    IncidentUpdate,
)


class UserSummarySerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "role",
        ]

    def get_role(self, user):
        group_names = set(
            user.groups.values_list("name", flat=True)
        )

        if user.is_superuser or "Admin" in group_names:
            return "Admin"

        if "Security Analyst" in group_names:
            return "Security Analyst"

        if "Staff" in group_names:
            return "Staff"

        return "Unassigned"


class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = '__all__'


class IncidentSerializer(serializers.ModelSerializer):
    reported_by_username = serializers.CharField(
        source='reported_by.username', read_only=True)
    assigned_to_username = serializers.CharField(
        source='assigned_to.username', read_only=True)
    affected_asset_name = serializers.CharField(
        source='affected_asset.name', read_only=True)

    class Meta:
        model = Incident
        fields = '__all__'
        read_only_fields = ['reported_by',
                            'created_at', 'updated_at', 'resolved_at']


class VulnerabilitySerializer(serializers.ModelSerializer):
    affected_asset_name = serializers.CharField(
        source='affected_asset.name', read_only=True)

    class Meta:
        model = Vulnerability
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'


class IncidentUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
        default="System",
    )

    incident_title = serializers.CharField(
        source="incident.title",
        read_only=True,
    )

    update_type_display = serializers.CharField(
        source="get_update_type_display",
        read_only=True,
    )

    class Meta:
        model = IncidentUpdate
        fields = [
            "id",
            "incident",
            "incident_title",
            "user",
            "username",
            "update_type",
            "update_type_display",
            "message",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "username",
            "incident_title",
            "update_type_display",
            "created_at",
        ]
