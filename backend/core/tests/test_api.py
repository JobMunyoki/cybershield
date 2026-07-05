from django.contrib.auth.models import Group, User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import (
    Asset,
    AuditLog,
    CriticalAlertState,
    Incident,
    IncidentUpdate,
)


class CyberShieldAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="api_admin",
            email="api_admin@example.com",
            password="StrongPassword123!",
        )

        self.staff = User.objects.create_user(
            username="api_staff",
            email="api_staff@example.com",
            password="StrongPassword123!",
        )

        self.other_user = User.objects.create_user(
            username="other_staff",
            email="other@example.com",
            password="StrongPassword123!",
        )

        staff_group, _ = Group.objects.get_or_create(
            name="Staff"
        )

        self.staff.groups.add(staff_group)
        self.other_user.groups.add(staff_group)

        self.asset = Asset.objects.create(
            name="Primary Router",
            asset_type="Router",
            ip_address="192.168.10.1",
            owner_department="IT",
            risk_level="High",
            status="Active",
        )

    def test_unauthenticated_user_cannot_list_assets(self):
        response = self.client.get(
            reverse("asset-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_asset_list_supports_pagination_and_ordering(self):
        for number in range(1, 7):
            Asset.objects.create(
                name=f"Asset {number:02d}",
                asset_type="Laptop",
                owner_department="IT",
                risk_level="Low",
                status="Active",
            )

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.get(
            reverse("asset-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            7,
        )

        self.assertEqual(
            len(response.data["results"]),
            5,
        )

        ordered_response = self.client.get(
            reverse("asset-list"),
            {
                "ordering": "name",
                "page_size": 100,
            },
        )

        returned_names = [
            asset["name"]
            for asset in ordered_response.data["results"]
        ]

        self.assertEqual(
            returned_names,
            sorted(returned_names),
        )

    def test_staff_only_sees_own_incidents(self):
        own_incident = Incident.objects.create(
            title="Staff phishing report",
            description="A phishing email was received.",
            category="Phishing",
            severity="Medium",
            reported_by=self.staff,
            affected_asset=self.asset,
        )

        Incident.objects.create(
            title="Another user's incident",
            description="A different incident.",
            category="Malware",
            severity="High",
            reported_by=self.other_user,
            affected_asset=self.asset,
        )

        self.client.force_authenticate(
            user=self.staff
        )

        response = self.client.get(
            reverse("incident-list")
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        returned_ids = [
            incident["id"]
            for incident in response.data["results"]
        ]

        self.assertEqual(
            returned_ids,
            [own_incident.id],
        )

    def test_staff_can_report_incident(self):
        self.client.force_authenticate(
            user=self.staff
        )

        payload = {
            "title": "Suspicious email attachment",
            "description": (
                "A suspicious attachment was received."
            ),
            "category": "Phishing",
            "severity": "High",
            "status": "Open",
            "affected_asset": self.asset.id,
        }

        response = self.client.post(
            reverse("incident-list"),
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        incident = Incident.objects.get(
            id=response.data["id"]
        )

        self.assertEqual(
            incident.reported_by,
            self.staff,
        )

        self.assertTrue(
            AuditLog.objects.filter(
                user=self.staff,
                action=(
                    "Reported new incident: "
                    "Suspicious email attachment"
                ),
            ).exists()
        )

    def test_incident_status_update_creates_timeline_and_audit_log(
        self
    ):
        incident = Incident.objects.create(
            title="Unauthorized login attempt",
            description="A suspicious login was detected.",
            category="Unauthorized Access",
            severity="High",
            status="Open",
            reported_by=self.staff,
            affected_asset=self.asset,
        )

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.patch(
            reverse(
                "incident-detail",
                kwargs={"pk": incident.id},
            ),
            {
                "status": "Escalated",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        incident.refresh_from_db()

        self.assertEqual(
            incident.status,
            "Escalated",
        )

        self.assertTrue(
            IncidentUpdate.objects.filter(
                incident=incident,
                user=self.admin,
                update_type="Status Change",
            ).exists()
        )

        self.assertTrue(
            AuditLog.objects.filter(
                user=self.admin,
                action__contains=(
                    "Updated incident: "
                    "Unauthorized login attempt"
                ),
            ).exists()
        )

    def test_admin_can_acknowledge_alert_but_staff_cannot_manage_it(
        self
    ):
        incident = Incident.objects.create(
            title="Critical account compromise",
            description=(
                "Administrator credentials may "
                "have been compromised."
            ),
            category="Unauthorized Access",
            severity="Critical",
            status="Escalated",
            reported_by=self.staff,
            affected_asset=self.asset,
            assigned_to=self.admin,
        )

        acknowledge_url = reverse(
            "critical-alert-action",
            kwargs={
                "alert_type": "incident",
                "object_id": incident.id,
                "action": "acknowledge",
            },
        )

        self.client.force_authenticate(
            user=self.admin
        )

        response = self.client.post(
            acknowledge_url,
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        alert_state = CriticalAlertState.objects.get(
            alert_type="incident",
            object_id=incident.id,
        )

        self.assertTrue(
            alert_state.acknowledged
        )

        self.assertEqual(
            alert_state.acknowledged_by,
            self.admin,
        )

        dismiss_url = reverse(
            "critical-alert-action",
            kwargs={
                "alert_type": "incident",
                "object_id": incident.id,
                "action": "dismiss",
            },
        )

        self.client.force_authenticate(
            user=self.staff
        )

        forbidden_response = self.client.post(
            dismiss_url,
            {},
            format="json",
        )

        self.assertEqual(
            forbidden_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        alert_state.refresh_from_db()

        self.assertFalse(
            alert_state.dismissed
        )
