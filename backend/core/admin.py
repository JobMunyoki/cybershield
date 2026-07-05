from django.contrib import admin
from .models import Asset, Incident, Vulnerability, AuditLog
from .models import (
    Asset,
    Incident,
    Vulnerability,
    AuditLog,
    IncidentUpdate,
    CriticalAlertState,
)


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('name', 'asset_type', 'ip_address',
                    'risk_level', 'status', 'created_at')
    search_fields = ('name', 'asset_type', 'ip_address')
    list_filter = ('asset_type', 'risk_level', 'status')


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'severity', 'status',
                    'reported_by', 'assigned_to', 'created_at')
    search_fields = ('title', 'category', 'severity', 'status')
    list_filter = ('category', 'severity', 'status')


@admin.register(Vulnerability)
class VulnerabilityAdmin(admin.ModelAdmin):
    list_display = ('title', 'affected_asset', 'risk_level',
                    'status', 'cvss_score', 'discovered_at')
    search_fields = ('title', 'risk_level', 'status')
    list_filter = ('risk_level', 'status')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'timestamp')
    search_fields = ('user__username', 'action')


@admin.register(IncidentUpdate)
class IncidentUpdateAdmin(admin.ModelAdmin):
    list_display = (
        "incident",
        "update_type",
        "user",
        "created_at",
    )

    list_filter = (
        "update_type",
        "created_at",
    )

    search_fields = (
        "incident__title",
        "message",
        "user__username",
    )

    readonly_fields = (
        "created_at",
    )

@admin.register(CriticalAlertState)
class CriticalAlertStateAdmin(admin.ModelAdmin):
    list_display = (
        "alert_type",
        "object_id",
        "acknowledged",
        "acknowledged_by",
        "dismissed",
        "dismissed_by",
    )

    list_filter = (
        "alert_type",
        "acknowledged",
        "dismissed",
    )

    search_fields = (
        "object_id",
        "acknowledged_by__username",
        "dismissed_by__username",
    )