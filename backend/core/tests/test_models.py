from django.contrib.auth.models import User
from django.db import IntegrityError, transaction
from django.test import TestCase

from core.models import (
    Asset,
    Incident,
    Vulnerability,
    AuditLog,
    IncidentUpdate,
    CriticalAlertState,
)


class CyberShieldModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="test_admin",
            email="admin@example.com",
            password="StrongPassword123!",
        )

        self.asset = Asset.objects.create(
            name="Main Office Router",
            asset_type="Router",
            ip_address="192.168.1.1",
            owner_department="IT",
            risk_level="Critical",
            status="Active",
        )

        self.incident = Incident.objects.create(
            title="Suspicious login attempt",
            description=(
                "Several suspicious login attempts "
                "were detected."
            ),
            category="Unauthorized Access",
            severity="Critical",
            affected_asset=self.asset,
            reported_by=self.user,
            assigned_to=self.user,
        )

        self.vulnerability = Vulnerability.objects.create(
            title="Weak administrator password",
            description=(
                "The router uses a weak administrator "
                "password."
            ),
            affected_asset=self.asset,
            risk_level="Critical",
            cvss_score="9.1",
            recommendation=(
                "Replace the password with a strong "
                "unique password."
            ),
        )

        self.audit_log = AuditLog.objects.create(
            user=self.user,
            action="Created test security records",
        )

        self.timeline_entry = IncidentUpdate.objects.create(
            incident=self.incident,
            user=self.user,
            update_type="Note",
            message="Initial investigation started.",
        )

        self.alert_state = CriticalAlertState.objects.create(
            alert_type="incident",
            object_id=self.incident.id,
        )

    def test_model_string_representations(self):
        self.assertEqual(
            str(self.asset),
            "Main Office Router",
        )

        self.assertEqual(
            str(self.incident),
            "Suspicious login attempt",
        )

        self.assertEqual(
            str(self.vulnerability),
            "Weak administrator password",
        )

        self.assertEqual(
            str(self.audit_log),
            "Created test security records",
        )

        self.assertEqual(
            str(self.timeline_entry),
            "Suspicious login attempt - Note",
        )

        self.assertEqual(
            str(self.alert_state),
            f"Critical Incident #{self.incident.id}",
        )

    def test_default_field_values(self):
        second_asset = Asset.objects.create(
            name="Reception Laptop",
            asset_type="Laptop",
        )

        second_incident = Incident.objects.create(
            title="Phishing email received",
            description="A suspicious email was received.",
            category="Phishing",
            severity="Medium",
            reported_by=self.user,
        )

        second_vulnerability = Vulnerability.objects.create(
            title="Outdated operating system",
            description="The operating system is outdated.",
            affected_asset=second_asset,
            risk_level="High",
            recommendation="Install security updates.",
        )

        second_update = IncidentUpdate.objects.create(
            incident=second_incident,
            user=self.user,
            message="Investigation started.",
        )

        second_alert_state = (
            CriticalAlertState.objects.create(
                alert_type="vulnerability",
                object_id=second_vulnerability.id,
            )
        )

        self.assertEqual(second_asset.risk_level, "Low")
        self.assertEqual(second_asset.status, "Active")

        self.assertEqual(second_incident.status, "Open")
        self.assertEqual(second_vulnerability.status, "Open")

        self.assertEqual(
            second_update.update_type,
            "Note",
        )

        self.assertFalse(
            second_alert_state.acknowledged
        )

        self.assertFalse(
            second_alert_state.dismissed
        )

    def test_asset_deletion_relationships(self):
        incident_id = self.incident.id
        vulnerability_id = self.vulnerability.id

        self.asset.delete()

        incident = Incident.objects.get(
            id=incident_id
        )

        self.assertIsNone(
            incident.affected_asset
        )

        vulnerability_exists = (
            Vulnerability.objects.filter(
                id=vulnerability_id
            ).exists()
        )

        self.assertFalse(
            vulnerability_exists
        )

    def test_critical_alert_state_must_be_unique(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                CriticalAlertState.objects.create(
                    alert_type="incident",
                    object_id=self.incident.id,
                )
