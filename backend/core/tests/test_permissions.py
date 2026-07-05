from decimal import Decimal

from django.contrib.auth.models import Group, User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import (
    Asset,
    AuditLog,
    Incident,
    IncidentUpdate,
    Vulnerability,
)


class RolePermissionMatrixTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        admin_group = Group.objects.create(
            name="Admin"
        )

        analyst_group = Group.objects.create(
            name="Security Analyst"
        )

        staff_group = Group.objects.create(
            name="Staff"
        )

        cls.admin = User.objects.create_user(
            username="permission_admin",
            email="admin@example.com",
        )

        cls.analyst = User.objects.create_user(
            username="permission_analyst",
            email="analyst@example.com",
        )

        cls.staff = User.objects.create_user(
            username="permission_staff",
            email="staff@example.com",
        )

        cls.other_staff = User.objects.create_user(
            username="other_staff",
            email="other@example.com",
        )

        cls.admin.groups.add(admin_group)
        cls.analyst.groups.add(analyst_group)
        cls.staff.groups.add(staff_group)
        cls.other_staff.groups.add(staff_group)

        cls.asset = Asset.objects.create(
            name="Test Router",
            asset_type="Router",
            ip_address="192.168.20.1",
            owner_department="IT",
            risk_level="High",
            status="Active",
        )

        cls.staff_incident = Incident.objects.create(
            title="Staff reported incident",
            description="An incident reported by staff.",
            category="Suspicious Activity",
            severity="Medium",
            status="Open",
            affected_asset=cls.asset,
            reported_by=cls.staff,
        )

        cls.other_incident = Incident.objects.create(
            title="Another staff incident",
            description=(
                "An incident reported by another user."
            ),
            category="Malware",
            severity="High",
            status="Open",
            affected_asset=cls.asset,
            reported_by=cls.other_staff,
        )

        cls.vulnerability = Vulnerability.objects.create(
            title="Outdated router firmware",
            description="The router firmware is outdated.",
            affected_asset=cls.asset,
            risk_level="High",
            cvss_score=Decimal("8.2"),
            recommendation="Install the latest firmware.",
            status="Open",
        )

        cls.audit_log = AuditLog.objects.create(
            user=cls.admin,
            action="Permission test audit entry",
        )

        cls.staff_timeline_entry = (
            IncidentUpdate.objects.create(
                incident=cls.staff_incident,
                user=cls.admin,
                update_type="Note",
                message="Staff incident investigation started.",
            )
        )

        cls.other_timeline_entry = (
            IncidentUpdate.objects.create(
                incident=cls.other_incident,
                user=cls.analyst,
                update_type="Evidence",
                message="Evidence collected.",
            )
        )

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def get_results(self, response):
        if isinstance(response.data, list):
            return response.data

        return response.data.get("results", [])

    def test_all_authenticated_roles_can_view_assets(self):
        for user in [
            self.admin,
            self.analyst,
            self.staff,
        ]:
            with self.subTest(username=user.username):
                self.authenticate(user)

                response = self.client.get(
                    reverse("asset-list")
                )

                self.assertEqual(
                    response.status_code,
                    status.HTTP_200_OK,
                )

    def test_only_admin_can_update_assets(self):
        role_expectations = [
            (
                self.admin,
                status.HTTP_200_OK,
            ),
            (
                self.analyst,
                status.HTTP_403_FORBIDDEN,
            ),
            (
                self.staff,
                status.HTTP_403_FORBIDDEN,
            ),
        ]

        for user, expected_status in role_expectations:
            with self.subTest(username=user.username):
                asset = Asset.objects.create(
                    name=f"{user.username} Laptop",
                    asset_type="Laptop",
                    risk_level="Low",
                    status="Active",
                )

                self.authenticate(user)

                response = self.client.patch(
                    reverse(
                        "asset-detail",
                        kwargs={"pk": asset.id},
                    ),
                    {
                        "risk_level": "High",
                    },
                    format="json",
                )

                self.assertEqual(
                    response.status_code,
                    expected_status,
                )

    def test_only_admin_can_delete_assets(self):
        role_expectations = [
            (
                self.admin,
                status.HTTP_204_NO_CONTENT,
            ),
            (
                self.analyst,
                status.HTTP_403_FORBIDDEN,
            ),
            (
                self.staff,
                status.HTTP_403_FORBIDDEN,
            ),
        ]

        for user, expected_status in role_expectations:
            with self.subTest(username=user.username):
                asset = Asset.objects.create(
                    name=f"{user.username} Temporary Asset",
                    asset_type="Other",
                    risk_level="Low",
                    status="Active",
                )

                self.authenticate(user)

                response = self.client.delete(
                    reverse(
                        "asset-detail",
                        kwargs={"pk": asset.id},
                    )
                )

                self.assertEqual(
                    response.status_code,
                    expected_status,
                )

    def test_all_authenticated_roles_can_report_incidents(
        self
    ):
        for user in [
            self.admin,
            self.analyst,
            self.staff,
        ]:
            with self.subTest(username=user.username):
                self.authenticate(user)

                response = self.client.post(
                    reverse("incident-list"),
                    {
                        "title": (
                            f"Incident reported by "
                            f"{user.username}"
                        ),
                        "description": (
                            "Permission matrix test incident."
                        ),
                        "category": "Suspicious Activity",
                        "severity": "Medium",
                        "status": "Open",
                        "affected_asset": self.asset.id,
                    },
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
                    user,
                )

    def test_admin_and_analyst_can_update_incidents(
        self
    ):
        role_expectations = [
            (
                self.admin,
                status.HTTP_200_OK,
            ),
            (
                self.analyst,
                status.HTTP_200_OK,
            ),
            (
                self.staff,
                status.HTTP_403_FORBIDDEN,
            ),
        ]

        for user, expected_status in role_expectations:
            with self.subTest(username=user.username):
                incident = Incident.objects.create(
                    title=(
                        f"Update test for "
                        f"{user.username}"
                    ),
                    description="Incident update test.",
                    category="Other",
                    severity="Low",
                    status="Open",
                    affected_asset=self.asset,
                    reported_by=self.staff,
                )

                self.authenticate(user)

                response = self.client.patch(
                    reverse(
                        "incident-detail",
                        kwargs={"pk": incident.id},
                    ),
                    {
                        "status": "Under Investigation",
                    },
                    format="json",
                )

                self.assertEqual(
                    response.status_code,
                    expected_status,
                )

    def test_only_admin_can_delete_incidents(self):
        role_expectations = [
            (
                self.admin,
                status.HTTP_204_NO_CONTENT,
            ),
            (
                self.analyst,
                status.HTTP_403_FORBIDDEN,
            ),
            (
                self.staff,
                status.HTTP_403_FORBIDDEN,
            ),
        ]

        for user, expected_status in role_expectations:
            with self.subTest(username=user.username):
                incident = Incident.objects.create(
                    title=(
                        f"Delete test for "
                        f"{user.username}"
                    ),
                    description="Incident deletion test.",
                    category="Other",
                    severity="Low",
                    status="Open",
                    reported_by=self.staff,
                )

                self.authenticate(user)

                response = self.client.delete(
                    reverse(
                        "incident-detail",
                        kwargs={"pk": incident.id},
                    )
                )

                self.assertEqual(
                    response.status_code,
                    expected_status,
                )

    def test_staff_cannot_view_another_users_incident(
        self
    ):
        self.authenticate(self.staff)

        own_response = self.client.get(
            reverse(
                "incident-detail",
                kwargs={
                    "pk": self.staff_incident.id
                },
            )
        )

        other_response = self.client.get(
            reverse(
                "incident-detail",
                kwargs={
                    "pk": self.other_incident.id
                },
            )
        )

        self.assertEqual(
            own_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            other_response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_only_admin_and_analyst_can_view_vulnerabilities(
        self
    ):
        role_expectations = [
            (
                self.admin,
                status.HTTP_200_OK,
            ),
            (
                self.analyst,
                status.HTTP_200_OK,
            ),
            (
                self.staff,
                status.HTTP_403_FORBIDDEN,
            ),
        ]

        for user, expected_status in role_expectations:
            with self.subTest(username=user.username):
                self.authenticate(user)

                response = self.client.get(
                    reverse("vulnerability-list")
                )

                self.assertEqual(
                    response.status_code,
                    expected_status,
                )

    def test_admin_and_analyst_can_create_vulnerabilities(
        self
    ):
        role_expectations = [
            (
                self.admin,
                status.HTTP_201_CREATED,
            ),
            (
                self.analyst,
                status.HTTP_201_CREATED,
            ),
            (
                self.staff,
                status.HTTP_403_FORBIDDEN,
            ),
        ]

        for user, expected_status in role_expectations:
            with self.subTest(username=user.username):
                self.authenticate(user)

                response = self.client.post(
                    reverse("vulnerability-list"),
                    {
                        "title": (
                            f"Vulnerability from "
                            f"{user.username}"
                        ),
                        "description": (
                            "Permission matrix vulnerability."
                        ),
                        "affected_asset": self.asset.id,
                        "risk_level": "Medium",
                        "cvss_score": "6.5",
                        "recommendation": (
                            "Apply the recommended patch."
                        ),
                        "status": "Open",
                    },
                    format="json",
                )

                self.assertEqual(
                    response.status_code,
                    expected_status,
                )

    def test_only_admin_can_delete_vulnerabilities(
        self
    ):
        role_expectations = [
            (
                self.admin,
                status.HTTP_204_NO_CONTENT,
            ),
            (
                self.analyst,
                status.HTTP_403_FORBIDDEN,
            ),
            (
                self.staff,
                status.HTTP_403_FORBIDDEN,
            ),
        ]

        for user, expected_status in role_expectations:
            with self.subTest(username=user.username):
                vulnerability = (
                    Vulnerability.objects.create(
                        title=(
                            f"Delete test for "
                            f"{user.username}"
                        ),
                        description=(
                            "Vulnerability deletion test."
                        ),
                        affected_asset=self.asset,
                        risk_level="Low",
                        cvss_score=Decimal("3.2"),
                        recommendation=(
                            "Apply configuration changes."
                        ),
                        status="Open",
                    )
                )

                self.authenticate(user)

                response = self.client.delete(
                    reverse(
                        "vulnerability-detail",
                        kwargs={
                            "pk": vulnerability.id
                        },
                    )
                )

                self.assertEqual(
                    response.status_code,
                    expected_status,
                )

    def test_only_admin_and_analyst_can_view_audit_logs(
        self
    ):
        role_expectations = [
            (
                self.admin,
                status.HTTP_200_OK,
            ),
            (
                self.analyst,
                status.HTTP_200_OK,
            ),
            (
                self.staff,
                status.HTTP_403_FORBIDDEN,
            ),
        ]

        for user, expected_status in role_expectations:
            with self.subTest(username=user.username):
                self.authenticate(user)

                response = self.client.get(
                    reverse("auditlog-list")
                )

                self.assertEqual(
                    response.status_code,
                    expected_status,
                )

    def test_staff_only_sees_timeline_for_own_incidents(
        self
    ):
        self.authenticate(self.staff)

        own_response = self.client.get(
            reverse("incidentupdate-list"),
            {
                "incident": self.staff_incident.id,
            },
        )

        other_response = self.client.get(
            reverse("incidentupdate-list"),
            {
                "incident": self.other_incident.id,
            },
        )

        self.assertEqual(
            own_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            other_response.status_code,
            status.HTTP_200_OK,
        )

        own_entries = self.get_results(
            own_response
        )

        other_entries = self.get_results(
            other_response
        )

        self.assertEqual(
            len(own_entries),
            1,
        )

        self.assertEqual(
            own_entries[0]["id"],
            self.staff_timeline_entry.id,
        )

        self.assertEqual(
            other_entries,
            [],
        )

    def test_only_admin_and_analyst_can_create_timeline_entries(
        self
    ):
        role_expectations = [
            (
                self.admin,
                status.HTTP_201_CREATED,
            ),
            (
                self.analyst,
                status.HTTP_201_CREATED,
            ),
            (
                self.staff,
                status.HTTP_403_FORBIDDEN,
            ),
        ]

        for user, expected_status in role_expectations:
            with self.subTest(username=user.username):
                self.authenticate(user)

                response = self.client.post(
                    reverse("incidentupdate-list"),
                    {
                        "incident":
                            self.staff_incident.id,
                        "update_type": "Note",
                        "message": (
                            f"Timeline update by "
                            f"{user.username}."
                        ),
                    },
                    format="json",
                )

                self.assertEqual(
                    response.status_code,
                    expected_status,
                )
