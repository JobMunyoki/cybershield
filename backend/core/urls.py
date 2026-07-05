from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AssetViewSet,
    IncidentViewSet,
    VulnerabilityViewSet,
    AuditLogViewSet,
    IncidentUpdateViewSet,
    dashboard_stats,
    current_user,
    assignable_users,
    critical_alert_action,
)

router = DefaultRouter()
router.register(r'assets', AssetViewSet)
router.register(r'incidents', IncidentViewSet)
router.register(r'vulnerabilities', VulnerabilityViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(
    r"incident-updates",
    IncidentUpdateViewSet,
)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
    path('auth/me/', current_user, name='current-user'),
    path(
        "users/assignable/",
        assignable_users,
        name="assignable-users",
    ),

    path(
        "critical-alerts/<str:alert_type>/<int:object_id>/<str:action>/",
        critical_alert_action,
        name="critical-alert-action",
    ),
]
