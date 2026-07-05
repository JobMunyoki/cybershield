from django.db import models
from django.contrib.auth.models import User


class Asset(models.Model):
    ASSET_TYPES = [
        ('Laptop', 'Laptop'),
        ('Server', 'Server'),
        ('Router', 'Router'),
        ('Database', 'Database'),
        ('Website', 'Website'),
        ('POS Machine', 'POS Machine'),
        ('Other', 'Other'),
    ]

    RISK_LEVELS = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]

    name = models.CharField(max_length=100)
    asset_type = models.CharField(max_length=50, choices=ASSET_TYPES)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    owner_department = models.CharField(max_length=100, blank=True, null=True)
    risk_level = models.CharField(
        max_length=20, choices=RISK_LEVELS, default='Low')
    status = models.CharField(max_length=50, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Incident(models.Model):
    CATEGORIES = [
        ('Phishing', 'Phishing'),
        ('Malware', 'Malware'),
        ('Unauthorized Access', 'Unauthorized Access'),
        ('Data Breach', 'Data Breach'),
        ('Network Attack', 'Network Attack'),
        ('Suspicious Activity', 'Suspicious Activity'),
        ('Other', 'Other'),
    ]

    SEVERITIES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]

    STATUSES = [
        ('Open', 'Open'),
        ('Under Investigation', 'Under Investigation'),
        ('Escalated', 'Escalated'),
        ('Resolved', 'Resolved'),
        ('Closed', 'Closed'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORIES)
    severity = models.CharField(max_length=20, choices=SEVERITIES)
    status = models.CharField(max_length=50, choices=STATUSES, default='Open')
    affected_asset = models.ForeignKey(
        Asset, on_delete=models.SET_NULL, null=True, blank=True)
    reported_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='reported_incidents')
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_incidents')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title


class Vulnerability(models.Model):
    RISK_LEVELS = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]

    STATUSES = [
        ('Open', 'Open'),
        ('In Progress', 'In Progress'),
        ('Fixed', 'Fixed'),
        ('Accepted Risk', 'Accepted Risk'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    affected_asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    risk_level = models.CharField(max_length=20, choices=RISK_LEVELS)
    cvss_score = models.DecimalField(
        max_digits=3, decimal_places=1, null=True, blank=True)
    recommendation = models.TextField()
    status = models.CharField(max_length=50, choices=STATUSES, default='Open')
    discovered_at = models.DateTimeField(auto_now_add=True)
    fixed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.title


class AuditLog(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.action


class IncidentUpdate(models.Model):
    UPDATE_TYPES = [
        ("Note", "Investigation Note"),
        ("Status Change", "Status Change"),
        ("Assignment", "Assignment Change"),
        ("Evidence", "Evidence Added"),
        ("Resolution", "Resolution Note"),
    ]

    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="timeline_entries",
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incident_updates",
    )

    update_type = models.CharField(
        max_length=30,
        choices=UPDATE_TYPES,
        default="Note",
    )

    message = models.TextField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.incident.title} - "
            f"{self.update_type}"
        )


class CriticalAlertState(models.Model):
    ALERT_TYPES = [
        ("incident", "Critical Incident"),
        ("vulnerability", "Critical Vulnerability"),
    ]

    alert_type = models.CharField(
        max_length=20,
        choices=ALERT_TYPES,
    )

    object_id = models.PositiveIntegerField()

    acknowledged = models.BooleanField(default=False)

    acknowledged_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acknowledged_critical_alerts",
    )

    acknowledged_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    dismissed = models.BooleanField(default=False)

    dismissed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dismissed_critical_alerts",
    )

    dismissed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["alert_type", "object_id"],
                name="unique_critical_alert_state",
            )
        ]

    def __str__(self):
        return (
            f"{self.get_alert_type_display()} "
            f"#{self.object_id}"
        )
