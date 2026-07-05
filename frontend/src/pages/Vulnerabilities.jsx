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

function Vulnerabilities() {
  const navigate = useNavigate();

  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [ordering, setOrdering] = useState("-discovered_at");

  const fetchVulnerabilities = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams();

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      if (riskFilter) {
        params.append("risk_level", riskFilter);
      }

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      params.append("page", String(page));
      params.append("page_size", String(pageSize));
      params.append("ordering", ordering);

      const queryString = params.toString();

      const endpoint = queryString
        ? `/vulnerabilities/?${queryString}`
        : "/vulnerabilities/";

      const response = await api.get(endpoint);

      if (Array.isArray(response.data)) {
        setVulnerabilities(response.data);
        setTotalCount(response.data.length);
      } else {
        setVulnerabilities(response.data.results || []);
        setTotalCount(response.data.count || 0);
      }
    } catch (err) {
      console.error("Failed to fetch vulnerabilities:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
      } else {
        setError("Failed to load vulnerabilities from the backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVulnerabilities();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    searchTerm,
    riskFilter,
    statusFilter,
    page,
    pageSize,
    ordering,
  ]);

    const riskColor = (riskLevel) => {
    switch (riskLevel) {
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
      case "In Progress":
        return "warning";
      case "Fixed":
        return "success";
      case "Accepted Risk":
        return "info";
      default:
        return "default";
    }
  };

  const handleExportCsv = () => {
  const today = new Date().toISOString().slice(0, 10);

  exportToCsv({
    filename: `cybershield-vulnerabilities-${today}.csv`,

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
        label: "Affected Asset",
        getValue: (vulnerability) =>
          vulnerability.affected_asset_name || "N/A",
      },
      {
        label: "Risk Level",
        key: "risk_level",
      },
      {
        label: "CVSS Score",
        getValue: (vulnerability) =>
          vulnerability.cvss_score ?? "N/A",
      },
      {
        label: "Status",
        key: "status",
      },
      {
        label: "Recommendation",
        key: "recommendation",
      },
      {
        label: "Discovered At",
        getValue: (vulnerability) =>
          vulnerability.discovered_at
            ? new Date(
                vulnerability.discovered_at
              ).toLocaleString()
            : "N/A",
      },
    ],

    rows: vulnerabilities,
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
          Vulnerability Management
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ marginBottom: 3 }}
        >
          View system weaknesses, affected assets, risk levels, and remediation
          status.
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
    onClick={() => navigate("/vulnerabilities/new")}
  >
    Add Vulnerability
  </Button>

  <Button
    variant="outlined"
    startIcon={<DownloadIcon />}
    onClick={handleExportCsv}
    disabled={vulnerabilities.length === 0}
  >
    Export CSV
  </Button>
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
            label="Search vulnerabilities"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
            placeholder="Search title, asset, or recommendation"
            sx={{ minWidth: 300 }}
          />

          <TextField
            select
            label="Risk level"
            value={riskFilter}
            onChange={(event) => {
              setRiskFilter(event.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All risk levels</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Critical">Critical</MenuItem>
          </TextField>

          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 190 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Fixed">Fixed</MenuItem>
            <MenuItem value="Accepted Risk">Accepted Risk</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            onClick={() => {
              setSearchTerm("");
              setRiskFilter("");
              setStatusFilter("");
              setPage(1);
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
            ) : vulnerabilities.length === 0 ? (
              <Typography>No vulnerabilities match the selected filters.</Typography>
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
                        <strong>Affected Asset</strong>
                      </TableCell>

                      <TableCell>
                        <TableSortLabel
                          active={
                            ordering === "risk_level" ||
                            ordering === "-risk_level"
                          }
                          direction={
                            ordering === "-risk_level"
                              ? "desc"
                              : "asc"
                          }
                          onClick={() => handleSort("risk_level")}
                        >
                          <strong>Risk Level</strong>
                        </TableSortLabel>
                      </TableCell>

                      <TableCell>
                        <TableSortLabel
                          active={
                            ordering === "cvss_score" ||
                            ordering === "-cvss_score"
                          }
                          direction={
                            ordering === "-cvss_score"
                              ? "desc"
                              : "asc"
                          }
                          onClick={() => handleSort("cvss_score")}
                        >
                          <strong>CVSS Score</strong>
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
                        <strong>Recommendation</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Actions</strong>
                        </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {vulnerabilities.map((vulnerability) => (
                      <TableRow key={vulnerability.id}>
                        <TableCell>{vulnerability.title}</TableCell>

                        <TableCell>
                          {vulnerability.affected_asset_name || "N/A"}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={vulnerability.risk_level}
                            color={riskColor(vulnerability.risk_level)}
                            size="small"
                          />
                        </TableCell>

                        <TableCell>
                          {vulnerability.cvss_score || "N/A"}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={vulnerability.status}
                            color={statusColor(vulnerability.status)}
                            size="small"
                          />
                        </TableCell>

                        <TableCell>
                          {vulnerability.recommendation}
                        </TableCell>

                        <TableCell>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() =>
                                navigate(`/vulnerabilities/${vulnerability.id}/edit`)
                                }
                            >
                                Edit
                            </Button>
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
                  {lastVisibleRecord} of {totalCount} vulnerabilities
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

export default Vulnerabilities;