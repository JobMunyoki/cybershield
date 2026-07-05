import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DownloadIcon from "@mui/icons-material/Download";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ComputerIcon from "@mui/icons-material/Computer";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import BugReportIcon from "@mui/icons-material/BugReport";
import api from "../api/axios";
import Navbar from "../components/Navbar";


const CHART_COLORS = [
  "#1976d2",
  "#ed6c02",
  "#d32f2f",
  "#2e7d32",
  "#7b1fa2",
];

function Dashboard() {

  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [alertActionLoading, setAlertActionLoading] = useState("");

  const summaryRef = useRef(null);

  const incidentStatusRef = useRef(null);
  const incidentSeverityRef = useRef(null);

  const vulnerabilityRiskRef = useRef(null);
  const vulnerabilityStatusRef = useRef(null);

  const [generatingPdf, setGeneratingPdf] = useState(false);

  const canManageSecurity =
  user?.role === "Admin" ||
  user?.role === "Security Analyst";

  const hasCriticalAlerts =
  (stats?.active_critical_incidents ?? 0) > 0 ||
  (stats?.active_critical_vulnerabilities ?? 0) > 0;

  const fetchDashboardData = async () => {
  try {
    const [statsResponse, userResponse] = await Promise.all([
      api.get("/dashboard/stats/"),
      api.get("/auth/me/"),
    ]);

    setStats(statsResponse.data);
    setUser(userResponse.data);
  } catch (err) {
    console.error("Failed to load dashboard data:", err);
    setError("Failed to load dashboard information.");
  }
};

  useEffect(() => {
    fetchDashboardData();
}, []);

const handleCriticalAlertAction = async (
  alertType,
  alertId,
  action
) => {
  const loadingKey =
    `${alertType}-${alertId}-${action}`;

  setAlertActionLoading(loadingKey);
  setError("");

  try {
    await api.post(
      `/critical-alerts/${alertType}/${alertId}/${action}/`
    );

    await fetchDashboardData();
  } catch (err) {
    console.error(
      "Failed to update critical alert:",
      err
    );

    if (err.response?.status === 401) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      navigate("/login");
    } else if (err.response?.status === 403) {
      setError(
        "You do not have permission to manage critical alerts."
      );
    } else {
      setError(
        "Failed to update the critical alert."
      );
    }
  } finally {
    setAlertActionLoading("");
  }
};

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  const handleDownloadPdf = async () => {
  if (
    !stats ||
    !summaryRef.current ||
    !incidentStatusRef.current ||
    !incidentSeverityRef.current
  ) {
    return;
  }

  setGeneratingPdf(true);
  setError("");

  try {
    // Give the Recharts components time to finish rendering.
    await new Promise((resolve) => setTimeout(resolve, 300));

    const captureElement = async (element) => {
      return html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
      });
    };

    const [
      summaryCanvas,
      incidentStatusCanvas,
      incidentSeverityCanvas,
      vulnerabilityRiskCanvas,
      vulnerabilityStatusCanvas,
    ] = await Promise.all([
      captureElement(summaryRef.current),
      captureElement(incidentStatusRef.current),
      captureElement(incidentSeverityRef.current),

      stats.scope === "organization" &&
      vulnerabilityRiskRef.current
        ? captureElement(vulnerabilityRiskRef.current)
        : Promise.resolve(null),

      stats.scope === "organization" &&
      vulnerabilityStatusRef.current
        ? captureElement(vulnerabilityStatusRef.current)
        : Promise.resolve(null),
    ]);

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 10;
    const contentTop = 30;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight =
      pageHeight - contentTop - margin;

    const addCanvasToPdf = (
      canvas,
      x,
      y,
      maxWidth,
      maxHeight
    ) => {
      if (!canvas) {
        return;
      }

      let imageWidth = maxWidth;
      let imageHeight =
        (canvas.height * imageWidth) / canvas.width;

      if (imageHeight > maxHeight) {
        imageHeight = maxHeight;
        imageWidth =
          (canvas.width * imageHeight) / canvas.height;
      }

      const centeredX =
        x + (maxWidth - imageWidth) / 2;

      const imageData = canvas.toDataURL("image/png");

      pdf.addImage(
        imageData,
        "PNG",
        centeredX,
        y,
        imageWidth,
        imageHeight,
        undefined,
        "FAST"
      );
    };

    const addPageHeading = (title, subtitle) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(title, margin, 14);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(subtitle, margin, 21);
    };

    const generatedDate =
      new Date().toLocaleString();

    /*
     * Page 1:
     * Dashboard summary cards.
     */
    addPageHeading(
      "CyberShield Dashboard Report",
      `Generated ${generatedDate} for ${
        user?.username || "CyberShield user"
      } (${user?.role || "Authenticated user"})`
    );

    addCanvasToPdf(
      summaryCanvas,
      margin,
      contentTop,
      printableWidth,
      printableHeight
    );

    /*
     * Page 2:
     * Incident analytics.
     */
    pdf.addPage();

    addPageHeading(
      "Incident Analytics",
      "Incident status and severity distribution"
    );

    const chartGap = 8;
    const chartWidth =
      (printableWidth - chartGap) / 2;

    addCanvasToPdf(
      incidentStatusCanvas,
      margin,
      contentTop,
      chartWidth,
      printableHeight
    );

    addCanvasToPdf(
      incidentSeverityCanvas,
      margin + chartWidth + chartGap,
      contentTop,
      chartWidth,
      printableHeight
    );

    /*
     * Page 3:
     * Vulnerability analytics.
     * Staff users do not receive this page.
     */
    if (
      stats.scope === "organization" &&
      vulnerabilityRiskCanvas &&
      vulnerabilityStatusCanvas
    ) {
      pdf.addPage();

      addPageHeading(
        "Vulnerability Analytics",
        "Vulnerability risk and remediation status distribution"
      );

      addCanvasToPdf(
        vulnerabilityRiskCanvas,
        margin,
        contentTop,
        chartWidth,
        printableHeight
      );

      addCanvasToPdf(
        vulnerabilityStatusCanvas,
        margin + chartWidth + chartGap,
        contentTop,
        chartWidth,
        printableHeight
      );
    }

    const today = new Date()
      .toISOString()
      .slice(0, 10);

    pdf.save(
      `cybershield-dashboard-report-${today}.pdf`
    );
  } catch (err) {
    console.error("Failed to generate PDF:", err);

    setError(
      "Failed to generate the dashboard PDF report."
    );
  } finally {
    setGeneratingPdf(false);
  }
};

  const StatCard = ({ title, value, icon }) => (
    <Card sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box>
            <Typography color="text.secondary" variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
          </Box>
          <Box>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderCriticalAlertActions = (
  alertType,
  alert,
  viewPath
) => {
  const acknowledgeKey =
    `${alertType}-${alert.id}-acknowledge`;

  const dismissKey =
    `${alertType}-${alert.id}-dismiss`;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <Button
        color="inherit"
        size="small"
        onClick={() => navigate(viewPath)}
      >
        View
      </Button>

      {canManageSecurity && (
        <>
          <Button
            color="inherit"
            size="small"
            disabled={
              alert.acknowledged ||
              alertActionLoading === acknowledgeKey
            }
            onClick={() =>
              handleCriticalAlertAction(
                alertType,
                alert.id,
                "acknowledge"
              )
            }
          >
            {alert.acknowledged
              ? "Acknowledged"
              : alertActionLoading === acknowledgeKey
                ? "Saving..."
                : "Acknowledge"}
          </Button>

          <Button
            color="inherit"
            size="small"
            disabled={
              alertActionLoading === dismissKey
            }
            onClick={() =>
              handleCriticalAlertAction(
                alertType,
                alert.id,
                "dismiss"
              )
            }
          >
            {alertActionLoading === dismissKey
              ? "Dismissing..."
              : "Dismiss"}
          </Button>
        </>
      )}
    </Box>
  );
};

  return (
    <Box sx={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <Navbar />
      <Box
        sx={{
          padding: 4,
          backgroundColor: "#f1f5f9",
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Security Overview
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ marginBottom: 3 }}>
          Monitor assets, incidents, and vulnerabilities from one dashboard.
        </Typography>

        <Box
          data-html2canvas-ignore="true"
          sx={{ marginBottom: 3 }}
        >
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPdf}
            disabled={generatingPdf || !stats}
          >
            {generatingPdf
              ? "Generating PDF..."
              : "Download PDF Report"}
          </Button>
        </Box>

        {error && (
          <Typography color="error" sx={{ marginBottom: 2 }}>
            {error}
          </Typography>
        )}

        {!stats ? (
          <CircularProgress />
        ) : (
          <>
          {hasCriticalAlerts && (
      <Box sx={{ marginBottom: 4 }}>
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{ marginBottom: 2 }}
        >
          Critical Security Alerts
        </Typography>

        {stats.critical_incident_alerts?.map(
          (incident) => (
            <Alert
              key={`incident-${incident.id}`}
              severity="error"
              variant="outlined"
              sx={{ marginBottom: 2 }}
              action={renderCriticalAlertActions(
                "incident",
                incident,
                canManageSecurity
                  ? `/incidents/${incident.id}/edit`
                  : "/incidents"
              )}
            >
              <AlertTitle>
                Critical Incident: {incident.title}
              </AlertTitle>

              Status: {incident.status}
              {" • "}
              Asset: {incident.affected_asset}
              {" • "}
              Assigned to: {incident.assigned_to}
              {incident.acknowledged && (
                <Typography
                  variant="body2"
                  sx={{ marginTop: 1, fontWeight: "bold" }}
                >
                  Acknowledged by{" "}
                  {incident.acknowledged_by || "Unknown user"}
                  {incident.acknowledged_at
                    ? ` on ${new Date(
                        incident.acknowledged_at
                      ).toLocaleString()}`
                    : ""}
                </Typography>
              )}
            </Alert>
          )
        )}

        {stats.critical_vulnerability_alerts?.map(
          (vulnerability) => (
            <Alert
              key={`vulnerability-${vulnerability.id}`}
              severity="error"
              variant="outlined"
              sx={{ marginBottom: 2 }}
              action={renderCriticalAlertActions(
                "vulnerability",
                vulnerability,
                `/vulnerabilities/${vulnerability.id}/edit`
              )}
            >
              <AlertTitle>
                Critical Vulnerability:{" "}
                {vulnerability.title}
              </AlertTitle>

              Status: {vulnerability.status}
              {" • "}
              Asset: {vulnerability.affected_asset}
              {" • "}
              CVSS: {vulnerability.cvss_score ?? "N/A"}
              {vulnerability.acknowledged && (
                <Typography
                  variant="body2"
                  sx={{ marginTop: 1, fontWeight: "bold" }}
                >
                  Acknowledged by{" "}
                  {vulnerability.acknowledged_by || "Unknown user"}
                  {vulnerability.acknowledged_at
                    ? ` on ${new Date(
                        vulnerability.acknowledged_at
                      ).toLocaleString()}`
                    : ""}
                </Typography>
              )}
            </Alert>
          )
        )}
      </Box>
    )}

          <Grid ref={summaryRef} container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Total Assets"
                value={stats.total_assets}
                icon={<ComputerIcon sx={{ fontSize: 40, color: "#1976d2" }} />}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Total Incidents"
                value={stats.total_incidents}
                icon={<ReportProblemIcon sx={{ fontSize: 40, color: "#ed6c02" }} />}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Open Incidents"
                value={stats.open_incidents}
                icon={<ReportProblemIcon sx={{ fontSize: 40, color: "#d32f2f" }} />}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Resolved Incidents"
                value={stats.resolved_incidents}
                icon={<ReportProblemIcon sx={{ fontSize: 40, color: "#2e7d32" }} />}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Total Vulnerabilities"
                value={stats.total_vulnerabilities}
                icon={<BugReportIcon sx={{ fontSize: 40, color: "#7b1fa2" }} />}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Open Vulnerabilities"
                value={stats.open_vulnerabilities}
                icon={<BugReportIcon sx={{ fontSize: 40, color: "#d32f2f" }} />}
              />
            </Grid>
          </Grid>
          <Typography
  variant="h5"
  fontWeight="bold"
  sx={{ marginTop: 5, marginBottom: 2 }}
>
  Security Analytics
</Typography>

<Grid container spacing={3}>
  <Grid size={{ xs: 12, md: 6 }}>
    <Card
      ref={incidentStatusRef}
      sx={{ borderRadius: 3, height: 420 }}
    >
      <CardContent sx={{ height: "100%" }}>
        <Typography variant="h6" gutterBottom>
          Incidents by Status
        </Typography>

        {stats.incidents_by_status?.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={stats.incidents_by_status}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Typography color="text.secondary">
            No incident data available.
          </Typography>
        )}
      </CardContent>
    </Card>
  </Grid>

  <Grid size={{ xs: 12, md: 6 }}>
    <Card
      ref={incidentSeverityRef}
      sx={{ borderRadius: 3, height: 420 }}
    >
      <CardContent sx={{ height: "100%" }}>
        <Typography variant="h6" gutterBottom>
          Incidents by Severity
        </Typography>

        {stats.incidents_by_severity?.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={stats.incidents_by_severity}
                dataKey="count"
                nameKey="severity"
                cx="50%"
                cy="45%"
                outerRadius={110}
                label
              >
                {stats.incidents_by_severity.map((entry, index) => (
                  <Cell
                    key={`${entry.severity}-${index}`}
                    fill={
                      CHART_COLORS[index % CHART_COLORS.length]
                    }
                  />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Typography color="text.secondary">
            No incident severity data available.
          </Typography>
        )}
      </CardContent>
    </Card>
  </Grid>

  {stats.scope === "organization" && (
    <>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card
          ref={vulnerabilityRiskRef}
          sx={{ borderRadius: 3, height: 420 }}
        >
          <CardContent sx={{ height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Vulnerabilities by Risk Level
            </Typography>

            {stats.vulnerabilities_by_risk?.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={stats.vulnerabilities_by_risk}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="risk_level" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#d32f2f" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary">
                No vulnerability risk data available.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card
          ref={vulnerabilityStatusRef}
          sx={{ borderRadius: 3, height: 420 }}
        >
          <CardContent sx={{ height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Vulnerabilities by Status
            </Typography>

            {stats.vulnerabilities_by_status?.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={stats.vulnerabilities_by_status}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="45%"
                    outerRadius={110}
                    label
                  >
                    {stats.vulnerabilities_by_status.map(
                      (entry, index) => (
                        <Cell
                          key={`${entry.status}-${index}`}
                          fill={
                            CHART_COLORS[
                              index % CHART_COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary">
                No vulnerability status data available.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </>
  )}
</Grid>
          </>
        )}
      </Box>
    </Box>
  );
}

export default Dashboard;