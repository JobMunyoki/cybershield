import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DownloadIcon from "@mui/icons-material/Download";
import { exportToCsv } from "../utils/exportCsv";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

function Incidents() {
  const navigate = useNavigate();
  const { user } = useAuth();

const canEditIncidents =
  user?.role === "Admin" ||
  user?.role === "Security Analyst";

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAssignedToMe, setShowAssignedToMe] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [ordering, setOrdering] = useState("-created_at");

  const fetchIncidents = async () => {
  try {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();

    if (showAssignedToMe) {
      params.append("assigned_to", "me");
    }

    if (searchTerm.trim()) {
      params.append("search", searchTerm.trim());
    }

    if (statusFilter) {
      params.append("status", statusFilter);
    }

    if (severityFilter) {
      params.append("severity", severityFilter);
    }

    params.append("page", String(page));
    params.append("page_size", String(pageSize));
    params.append("ordering", ordering);

    const response = await api.get(
      `/incidents/?${params.toString()}`
    );

    if (Array.isArray(response.data)) {
      setIncidents(response.data);
      setTotalCount(response.data.length);
    } else {
      setIncidents(response.data.results || []);
      setTotalCount(response.data.count || 0);
    }
  } catch (err) {
    console.error("Failed to fetch incidents:", err);

    if (err.response?.status === 401) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      navigate("/login");
    } else {
      setError("Failed to load incidents from the backend.");
    }
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  const timer = setTimeout(() => {
    fetchIncidents();
  }, 300);

  return () => clearTimeout(timer);
}, [
  showAssignedToMe,
  searchTerm,
  statusFilter,
  severityFilter,
  page,
  pageSize,
  ordering,
]);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  const severityColor = (severity) => {
    switch (severity) {
      case "Critical":
        return "error";
      case "High":
        return "warning";
      case "Medium":
        return "info";
      default:
        return "success";
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "Open":
        return "error";
      case "Under Investigation":
        return "warning";
      case "Resolved":
      case "Closed":
        return "success";
      default:
        return "default";
    }
  };

  const handleExportCsv = () => {
  const today = new Date()
    .toISOString()
    .slice(0, 10);

  exportToCsv({
    filename: `cybershield-incidents-${today}.csv`,

    columns: [
      {
        label: "Title",
        key: "title",
      },
      {
        label: "Description",
        key: "description",
      },
      {
        label: "Category",
        key: "category",
      },
      {
        label: "Severity",
        key: "severity",
      },
      {
        label: "Status",
        key: "status",
      },
      {
        label: "Affected Asset",
        getValue: (incident) =>
          incident.affected_asset_name || "N/A",
      },
      {
        label: "Reported By",
        getValue: (incident) =>
          incident.reported_by_username || "N/A",
      },
      {
        label: "Assigned To",
        getValue: (incident) =>
          incident.assigned_to_username || "Unassigned",
      },
    ],

    rows: incidents,
  });
};

const handleSort = (field) => {
  setOrdering((currentOrdering) => {
    if (currentOrdering === field) {
      return `-${field}`;
    }

    return field;
  });

  setPage(1);
};

const totalPages = Math.ceil(totalCount / pageSize);

const firstVisibleRecord =
  totalCount === 0
    ? 0
    : (page - 1) * pageSize + 1;

const lastVisibleRecord = Math.min(
  page * pageSize,
  totalCount
);

  return (
    <Box sx={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <Navbar />

      <Box sx={{ padding: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Incident Management
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ marginBottom: 3 }}
        >
          View reported cybersecurity incidents and their investigation status.
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            marginBottom: 3,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            onClick={() => navigate("/incidents/new")}
          >
            Report Incident
          </Button>

          {canEditIncidents && (
            <>
              <Button
                variant={showAssignedToMe ? "outlined" : "contained"}
                onClick={() => {
                  setShowAssignedToMe(false);
                  setPage(1);
                }}
              >
                All Incidents
              </Button>

              <Button
                variant={showAssignedToMe ? "contained" : "outlined"}
                onClick={() => {
                  setShowAssignedToMe(true);
                  setPage(1);
                }}
              >
                Assigned to Me
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportCsv}
                disabled={incidents.length === 0}
              >
                Export CSV
              </Button>
            </>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            marginBottom: 3,
            flexWrap: "wrap",
          }}
        >
          <TextField
            label="Search incidents"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
            placeholder="Search title, description, or category"
            sx={{ minWidth: 280 }}
          />

          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="Under Investigation">
              Under Investigation
            </MenuItem>
            <MenuItem value="Escalated">Escalated</MenuItem>
            <MenuItem value="Resolved">Resolved</MenuItem>
            <MenuItem value="Closed">Closed</MenuItem>
          </TextField>

          <TextField
            select
            label="Severity"
            value={severityFilter}
            onChange={(event) => {
              setSeverityFilter(event.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All severities</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Critical">Critical</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
              setSeverityFilter("");
              setShowAssignedToMe(false);
            }}
          >
            Clear Filters
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            {loading ? (
              <CircularProgress />
            ) : incidents.length === 0 ? (
              <Typography>
                {showAssignedToMe
                  ? "No incidents are currently assigned to you."
                  : "No incidents found."}
              </Typography>
            ) : (
              <>
                <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={
                            ordering === "title" ||
                            ordering === "-title"
                          }
                          direction={
                            ordering === "-title" ? "desc" : "asc"
                          }
                          onClick={() => handleSort("title")}
                        >
                          <strong>Title</strong>
                        </TableSortLabel>
                      </TableCell>

                      <TableCell>
                        <TableSortLabel
                          active={
                            ordering === "category" ||
                            ordering === "-category"
                          }
                          direction={
                            ordering === "-category" ? "desc" : "asc"
                          }
                          onClick={() => handleSort("category")}
                        >
                          <strong>Category</strong>
                        </TableSortLabel>
                      </TableCell>

                      <TableCell>
                        <TableSortLabel
                          active={
                            ordering === "severity" ||
                            ordering === "-severity"
                          }
                          direction={
                            ordering === "-severity" ? "desc" : "asc"
                          }
                          onClick={() => handleSort("severity")}
                        >
                          <strong>Severity</strong>
                        </TableSortLabel>
                      </TableCell>

                      <TableCell>
                        <TableSortLabel
                          active={
                            ordering === "status" ||
                            ordering === "-status"
                          }
                          direction={
                            ordering === "-status" ? "desc" : "asc"
                          }
                          onClick={() => handleSort("status")}
                        >
                          <strong>Status</strong>
                        </TableSortLabel>
                      </TableCell>

                      <TableCell>
                        <strong>Affected Asset</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Reported By</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Assigned To</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Actions</strong>
                        </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {incidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell>{incident.title}</TableCell>

                        <TableCell>{incident.category}</TableCell>

                        <TableCell>
                          <Chip
                            label={incident.severity}
                            color={severityColor(incident.severity)}
                            size="small"
                          />
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={incident.status}
                            color={statusColor(incident.status)}
                            size="small"
                          />
                        </TableCell>

                        <TableCell>
                          {incident.affected_asset_name || "N/A"}
                        </TableCell>

                        <TableCell>
                          {incident.reported_by_username || "N/A"}
                        </TableCell>

                        <TableCell>
                          {incident.assigned_to_username || "Unassigned"}
                        </TableCell>

                        <TableCell>
                            {canEditIncidents ? (
                                <Button
                                variant="outlined"
                                size="small"
                                onClick={() => navigate(`/incidents/${incident.id}/edit`)}
                                >
                                Edit
                                </Button>
                            ) : (
                                "View only"
                            )}
                            </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  marginTop: 3,
                }}
              >
                <Typography color="text.secondary">
                  Showing {firstVisibleRecord}–
                  {lastVisibleRecord} of {totalCount} incidents
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <TextField
                    select
                    size="small"
                    label="Rows per page"
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(1);
                    }}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                  </TextField>

                  {totalPages > 0 && (
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(event, selectedPage) => {
                        setPage(selectedPage);
                      }}
                      color="primary"
                      showFirstButton
                      showLastButton
                    />
                  )}
                </Box>
              </Box>
                </>
              )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default Incidents;