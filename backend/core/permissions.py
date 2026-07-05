from rest_framework.permissions import BasePermission, SAFE_METHODS


def is_admin(user):
    return (
        user.is_authenticated
        and (
            user.is_superuser
            or user.groups.filter(name="Admin").exists()
        )
    )


def is_security_analyst(user):
    return (
        user.is_authenticated
        and user.groups.filter(name="Security Analyst").exists()
    )


class AssetPermission(BasePermission):
    message = "You do not have permission to modify assets."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Every authenticated user may view assets.
        if request.method in SAFE_METHODS:
            return True

        # Only administrators may add, update, or delete assets.
        return is_admin(request.user)


class IncidentPermission(BasePermission):
    message = "You do not have permission to perform this incident action."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Every authenticated user may view or report incidents.
        if request.method in SAFE_METHODS or request.method == "POST":
            return True

        # Administrators and analysts may update incidents.
        if request.method in ["PUT", "PATCH"]:
            return (
                is_admin(request.user)
                or is_security_analyst(request.user)
            )

        # Only administrators may delete incidents.
        if request.method == "DELETE":
            return is_admin(request.user)

        return False


class VulnerabilityPermission(BasePermission):
    message = "Only administrators and security analysts can access vulnerabilities."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Only administrators may delete vulnerabilities.
        if request.method == "DELETE":
            return is_admin(request.user)

        # Administrators and analysts may view, create, and update them.
        return (
            is_admin(request.user)
            or is_security_analyst(request.user)
        )


class AuditLogPermission(BasePermission):
    message = "Only administrators and security analysts can view audit logs."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return (
            request.method in SAFE_METHODS
            and (
                is_admin(request.user)
                or is_security_analyst(request.user)
            )
        )


class IncidentUpdatePermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        # All authenticated users may read permitted timeline entries.
        if request.method in SAFE_METHODS:
            return True

        # Only Admin and Security Analyst can create or modify entries.
        return is_admin(user) or is_security_analyst(user)

    def has_object_permission(self, request, view, obj):
        user = request.user

        if is_admin(user) or is_security_analyst(user):
            return True

        # Staff may only read updates belonging to incidents they reported.
        return (
            request.method in SAFE_METHODS
            and obj.incident.reported_by_id == user.id
        )
