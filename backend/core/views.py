from rest_framework import filters, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from rest_framework import status as drf_status

from .models import (
    Asset,
    Incident,
    Vulnerability,
    AuditLog,
    IncidentUpdate,
    CriticalAlertState,
)
from .serializers import (
    AssetSerializer,
    IncidentSerializer,
    VulnerabilitySerializer,
    AuditLogSerializer,
    UserSummarySerializer,
    IncidentUpdateSerializer,
)

from .permissions import (
    AssetPermission,
    IncidentPermission,
    VulnerabilityPermission,
    AuditLogPermission,
    IncidentUpdatePermission,
    is_admin,
    is_security_analyst,
)

from django.contrib.auth.models import User
from django.db.models import Q, Count


class AssetViewSet(viewsets.ModelViewSet):
    queryset = Asset.objects.all().order_by('-created_at')
    serializer_class = AssetSerializer
    permission_classes = [AssetPermission]

    filter_backends = [filters.OrderingFilter]

    ordering_fields = [
        "name",
        "asset_type",
        "ip_address",
        "owner_department",
        "risk_level",
        "status",
        "created_at",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = Asset.objects.all().order_by("-created_at")

        search = self.request.query_params.get("search", "").strip()
        asset_type = self.request.query_params.get("asset_type", "").strip()
        risk_level = self.request.query_params.get("risk_level", "").strip()
        status = self.request.query_params.get("status", "").strip()

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(ip_address__icontains=search)
                | Q(owner_department__icontains=search)
            )

        if asset_type:
            queryset = queryset.filter(asset_type=asset_type)

        if risk_level:
            queryset = queryset.filter(risk_level=risk_level)

        if status:
            queryset = queryset.filter(status=status)

        return queryset

    def perform_create(self, serializer):
        asset = serializer.save()

        AuditLog.objects.create(
            user=self.request.user,
            action=f"Added asset: {asset.name}"
        )

    def perform_update(self, serializer):
        asset = serializer.save()

        AuditLog.objects.create(
            user=self.request.user,
            action=f"Updated asset: {asset.name}"
        )


class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.all().order_by("-created_at")
    serializer_class = IncidentSerializer
    permission_classes = [IncidentPermission]

    filter_backends = [filters.OrderingFilter]

    ordering_fields = [
        "title",
        "category",
        "severity",
        "status",
        "created_at",
        "updated_at",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = Incident.objects.all().order_by("-created_at")
        user = self.request.user

        # Staff users can only view incidents they reported.
        if not (is_admin(user) or is_security_analyst(user)):
            queryset = queryset.filter(reported_by=user)

        # Admins and analysts can filter incidents assigned to themselves.
        assigned_filter = self.request.query_params.get("assigned_to")

        if (
            assigned_filter == "me"
            and (is_admin(user) or is_security_analyst(user))
        ):
            queryset = queryset.filter(assigned_to=user)

        search = self.request.query_params.get("search", "").strip()
        status = self.request.query_params.get("status", "").strip()
        severity = self.request.query_params.get("severity", "").strip()

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(category__icontains=search)
            )

        if status:
            queryset = queryset.filter(status=status)

        if severity:
            queryset = queryset.filter(severity=severity)

        return queryset

    def perform_create(self, serializer):
        incident = serializer.save(
            reported_by=self.request.user
        )

        AuditLog.objects.create(
            user=self.request.user,
            action=f"Reported new incident: {incident.title}",
        )

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        old_severity = serializer.instance.severity
        old_assigned_to_id = serializer.instance.assigned_to_id

        old_assigned_to_name = (
            serializer.instance.assigned_to.username
            if serializer.instance.assigned_to
            else "Unassigned"
        )

        incident = serializer.save()

        if (
            old_status != incident.status
            or old_severity != incident.severity
        ):
            CriticalAlertState.objects.filter(
                alert_type="incident",
                object_id=incident.id,
            ).delete()

        if old_status != incident.status:
            IncidentUpdate.objects.create(
                incident=incident,
                user=self.request.user,
                update_type="Status Change",
                message=(
                    f"Status changed from {old_status} "
                    f"to {incident.status}."
                ),
            )

        if old_assigned_to_id != incident.assigned_to_id:
            new_assigned_to_name = (
                incident.assigned_to.username
                if incident.assigned_to
                else "Unassigned"
            )

            IncidentUpdate.objects.create(
                incident=incident,
                user=self.request.user,
                update_type="Assignment",
                message=(
                    f"Incident assignment changed from "
                    f"{old_assigned_to_name} to "
                    f"{new_assigned_to_name}."
                ),
            )

        AuditLog.objects.create(
            user=self.request.user,
            action=(
                f"Updated incident: {incident.title} "
                f"— Status: {incident.status}"
            ),
        )


class VulnerabilityViewSet(viewsets.ModelViewSet):
    queryset = Vulnerability.objects.all().order_by('-discovered_at')
    serializer_class = VulnerabilitySerializer
    permission_classes = [VulnerabilityPermission]

    filter_backends = [filters.OrderingFilter]

    ordering_fields = [
        "title",
        "risk_level",
        "cvss_score",
        "status",
        "discovered_at",
        "fixed_at",
    ]

    ordering = ["-discovered_at"]

    def get_queryset(self):
        queryset = Vulnerability.objects.all().order_by("-discovered_at")

        search = self.request.query_params.get("search", "").strip()
        risk_level = self.request.query_params.get("risk_level", "").strip()
        status = self.request.query_params.get("status", "").strip()

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(recommendation__icontains=search)
                | Q(affected_asset__name__icontains=search)
            )

        if risk_level:
            queryset = queryset.filter(risk_level=risk_level)

        if status:
            queryset = queryset.filter(status=status)

        return queryset

    def perform_create(self, serializer):
        vulnerability = serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action=f"Added vulnerability: {vulnerability.title}"
        )

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        old_risk_level = serializer.instance.risk_level

        vulnerability = serializer.save()

        if (
            old_status != vulnerability.status
            or old_risk_level != vulnerability.risk_level
        ):
            CriticalAlertState.objects.filter(
                alert_type="vulnerability",
                object_id=vulnerability.id,
            ).delete()

        AuditLog.objects.create(
            user=self.request.user,
            action=(
                f"Updated vulnerability: {vulnerability.title} "
                f"— Status: {vulnerability.status}"
            ),
        )


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related(
        "user"
    ).all().order_by("-timestamp")

    serializer_class = AuditLogSerializer
    permission_classes = [AuditLogPermission]

    filter_backends = [filters.OrderingFilter]

    ordering_fields = [
        "action",
        "timestamp",
        "user__username",
    ]

    ordering = ["-timestamp"]


class IncidentUpdateViewSet(viewsets.ModelViewSet):
    queryset = IncidentUpdate.objects.select_related(
        "incident",
        "user",
    ).all()

    serializer_class = IncidentUpdateSerializer
    permission_classes = [IncidentUpdatePermission]

    filter_backends = [filters.OrderingFilter]

    ordering_fields = [
        "created_at",
        "update_type",
        "user__username",
    ]

    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = IncidentUpdate.objects.select_related(
            "incident",
            "user",
        ).all()

        user = self.request.user

        # Staff can only view updates for incidents they reported.
        if not (
            is_admin(user)
            or is_security_analyst(user)
        ):
            queryset = queryset.filter(
                incident__reported_by=user
            )

        # Allow filtering by one incident.
        incident_id = self.request.query_params.get(
            "incident"
        )

        if incident_id:
            queryset = queryset.filter(
                incident_id=incident_id
            )

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        update = serializer.save(
            user=self.request.user
        )

        AuditLog.objects.create(
            user=self.request.user,
            action=(
                f"Added {update.get_update_type_display()} "
                f"to incident: {update.incident.title}"
            ),
        )

    def perform_update(self, serializer):
        update = serializer.save()

        AuditLog.objects.create(
            user=self.request.user,
            action=(
                f"Updated timeline entry for incident: "
                f"{update.incident.title}"
            ),
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user

    if is_admin(user) or is_security_analyst(user):
        incident_queryset = Incident.objects.all()
        vulnerability_queryset = Vulnerability.objects.all()
        dashboard_scope = "organization"
    else:
        incident_queryset = Incident.objects.filter(
            reported_by=user
        )
        vulnerability_queryset = Vulnerability.objects.none()
        dashboard_scope = "personal"

    active_critical_incidents = (
        incident_queryset
        .filter(
            severity="Critical",
            status__in=[
                "Open",
                "Under Investigation",
                "Escalated",
            ],
        )
        .select_related(
            "affected_asset",
            "assigned_to",
        )
        .order_by("-created_at")
    )

    active_critical_vulnerabilities = (
        vulnerability_queryset
        .filter(
            risk_level="Critical",
            status__in=[
                "Open",
                "In Progress",
            ],
        )
        .select_related("affected_asset")
        .order_by("-discovered_at")
    )

    dismissed_incident_ids = (
        CriticalAlertState.objects
        .filter(
            alert_type="incident",
            dismissed=True,
        )
        .values_list("object_id", flat=True)
    )

    dismissed_vulnerability_ids = (
        CriticalAlertState.objects
        .filter(
            alert_type="vulnerability",
            dismissed=True,
        )
        .values_list("object_id", flat=True)
    )

    visible_critical_incidents = (
        active_critical_incidents.exclude(
            id__in=dismissed_incident_ids
        )
    )

    visible_critical_vulnerabilities = (
        active_critical_vulnerabilities.exclude(
            id__in=dismissed_vulnerability_ids
        )
    )

    incident_alert_states = {
        state.object_id: state
        for state in CriticalAlertState.objects.filter(
            alert_type="incident",
            object_id__in=(
                visible_critical_incidents.values_list(
                    "id",
                    flat=True,
                )
            ),
        ).select_related("acknowledged_by")
    }

    vulnerability_alert_states = {
        state.object_id: state
        for state in CriticalAlertState.objects.filter(
            alert_type="vulnerability",
            object_id__in=(
                visible_critical_vulnerabilities.values_list(
                    "id",
                    flat=True,
                )
            ),
        ).select_related("acknowledged_by")
    }

    critical_incident_alerts = []

    for incident in visible_critical_incidents[:5]:
        alert_state = incident_alert_states.get(
            incident.id
        )

        critical_incident_alerts.append({
            "id": incident.id,
            "title": incident.title,
            "status": incident.status,
            "affected_asset": (
                incident.affected_asset.name
                if incident.affected_asset
                else "N/A"
            ),
            "assigned_to": (
                incident.assigned_to.username
                if incident.assigned_to
                else "Unassigned"
            ),
            "acknowledged": (
                alert_state.acknowledged
                if alert_state
                else False
            ),
            "acknowledged_by": (
                alert_state.acknowledged_by.username
                if (
                    alert_state
                    and alert_state.acknowledged_by
                )
                else None
            ),
            "acknowledged_at": (
                alert_state.acknowledged_at
                if alert_state
                else None
            ),
        })

    critical_vulnerability_alerts = []

    for vulnerability in visible_critical_vulnerabilities[:5]:
        alert_state = vulnerability_alert_states.get(
            vulnerability.id
        )

        critical_vulnerability_alerts.append({
            "id": vulnerability.id,
            "title": vulnerability.title,
            "status": vulnerability.status,
            "cvss_score": vulnerability.cvss_score,
            "affected_asset": (
                vulnerability.affected_asset.name
                if vulnerability.affected_asset
                else "N/A"
            ),
            "acknowledged": (
                alert_state.acknowledged
                if alert_state
                else False
            ),
            "acknowledged_by": (
                alert_state.acknowledged_by.username
                if (
                    alert_state
                    and alert_state.acknowledged_by
                )
                else None
            ),
            "acknowledged_at": (
                alert_state.acknowledged_at
                if alert_state
                else None
            ),
        })

    data = {
        "scope": dashboard_scope,
        "total_assets": Asset.objects.count(),
        "total_incidents": incident_queryset.count(),

        "open_incidents": incident_queryset.filter(
            status="Open"
        ).count(),

        "under_investigation": incident_queryset.filter(
            status="Under Investigation"
        ).count(),

        "resolved_incidents": incident_queryset.filter(
            status="Resolved"
        ).count(),

        "critical_incidents": incident_queryset.filter(
            severity="Critical"
        ).count(),

        "total_vulnerabilities":
            vulnerability_queryset.count(),

        "open_vulnerabilities":
            vulnerability_queryset.filter(
                status="Open"
        ).count(),

        "critical_vulnerabilities":
            vulnerability_queryset.filter(
                risk_level="Critical"
        ).count(),

        "incidents_by_status": list(
            incident_queryset
            .values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        ),

        "incidents_by_severity": list(
            incident_queryset
            .values("severity")
            .annotate(count=Count("id"))
            .order_by("severity")
        ),

        "vulnerabilities_by_risk": list(
            vulnerability_queryset
            .values("risk_level")
            .annotate(count=Count("id"))
            .order_by("risk_level")
        ),

        "vulnerabilities_by_status": list(
            vulnerability_queryset
            .values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        ),

        "active_critical_incidents":
            visible_critical_incidents.count(),

        "active_critical_vulnerabilities":
            visible_critical_vulnerabilities.count(),

        "critical_incident_alerts":
            critical_incident_alerts,

        "critical_vulnerability_alerts":
            critical_vulnerability_alerts,
    }

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    user = request.user
    group_names = set(
        user.groups.values_list('name', flat=True)
    )

    if user.is_superuser or 'Admin' in group_names:
        role = 'Admin'
    elif 'Security Analyst' in group_names:
        role = 'Security Analyst'
    elif 'Staff' in group_names:
        role = 'Staff'
    else:
        role = 'Unassigned'

    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': role,
        'groups': list(group_names),
        'is_superuser': user.is_superuser,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def assignable_users(request):
    users = User.objects.filter(
        Q(is_superuser=True)
        | Q(groups__name="Admin")
        | Q(groups__name="Security Analyst")
    ).distinct().order_by("username")

    serializer = UserSummarySerializer(users, many=True)

    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def critical_alert_action(
    request,
    alert_type,
    object_id,
    action,
):
    user = request.user

    if not (
        is_admin(user)
        or is_security_analyst(user)
    ):
        return Response(
            {
                "detail": (
                    "Only Admin and Security Analyst users "
                    "can manage critical alerts."
                )
            },
            status=drf_status.HTTP_403_FORBIDDEN,
        )

    if alert_type == "incident":
        alert_exists = Incident.objects.filter(
            id=object_id,
            severity="Critical",
            status__in=[
                "Open",
                "Under Investigation",
                "Escalated",
            ],
        ).exists()

    elif alert_type == "vulnerability":
        alert_exists = Vulnerability.objects.filter(
            id=object_id,
            risk_level="Critical",
            status__in=[
                "Open",
                "In Progress",
            ],
        ).exists()

    else:
        return Response(
            {"detail": "Invalid alert type."},
            status=drf_status.HTTP_400_BAD_REQUEST,
        )

    if not alert_exists:
        return Response(
            {
                "detail": (
                    "The critical alert does not exist "
                    "or is no longer active."
                )
            },
            status=drf_status.HTTP_404_NOT_FOUND,
        )

    if action not in ["acknowledge", "dismiss"]:
        return Response(
            {"detail": "Invalid alert action."},
            status=drf_status.HTTP_400_BAD_REQUEST,
        )

    alert_state, _ = CriticalAlertState.objects.get_or_create(
        alert_type=alert_type,
        object_id=object_id,
    )

    current_time = timezone.now()

    if action == "acknowledge":
        alert_state.acknowledged = True
        alert_state.acknowledged_by = user
        alert_state.acknowledged_at = current_time

        audit_action = (
            f"Acknowledged critical {alert_type} "
            f"alert #{object_id}"
        )

    else:
        alert_state.acknowledged = True

        if not alert_state.acknowledged_by:
            alert_state.acknowledged_by = user
            alert_state.acknowledged_at = current_time

        alert_state.dismissed = True
        alert_state.dismissed_by = user
        alert_state.dismissed_at = current_time

        audit_action = (
            f"Dismissed critical {alert_type} "
            f"alert #{object_id}"
        )

    alert_state.save()

    AuditLog.objects.create(
        user=user,
        action=audit_action,
    )

    return Response({
        "alert_type": alert_state.alert_type,
        "object_id": alert_state.object_id,
        "acknowledged": alert_state.acknowledged,
        "acknowledged_by": (
            alert_state.acknowledged_by.username
            if alert_state.acknowledged_by
            else None
        ),
        "acknowledged_at": alert_state.acknowledged_at,
        "dismissed": alert_state.dismissed,
        "dismissed_by": (
            alert_state.dismissed_by.username
            if alert_state.dismissed_by
            else None
        ),
        "dismissed_at": alert_state.dismissed_at,
    })
