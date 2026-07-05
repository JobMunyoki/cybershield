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

function AuditLogs() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [ordering, setOrdering] = useState("-timestamp");

const handleExportCsv = () => {
  const today = new Date().toISOString().slice(0, 10);

  exportToCsv({
    filename: `cybershield-audit-logs-${today}.csv`,

    columns: [
      {
        label: "User",
        getValue: (log) =>
          log.username || log.user_username || "System",
      },
      {
        label: "Action",
        key: "action",
      },
      {
        label: "Timestamp",
        getValue: (log) =>
          log.timestamp
            ? new Date(log.timestamp).toLocaleString()
            : "N/A",
      },
    ],

    rows: logs,
  });
};

  useEffect(() => {
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.append("page", String(page));
      params.append("page_size", String(pageSize));
      params.append("ordering", ordering);

      const response = await api.get(
        `/audit-logs/?${params.toString()}`
      );

      if (Array.isArray(response.data)) {
        setLogs(response.data);
        setTotalCount(response.data.length);
      } else {
        setLogs(response.data.results || []);
        setTotalCount(response.data.count || 0);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
      } else {
        setError("Failed to load audit logs.");
      }
    } finally {
      setLoading(false);
    }
  };

  fetchAuditLogs();
}, [
  page,
  pageSize,
  ordering,
  navigate,
]);

    const formatDate = (dateValue) => {
    if (!dateValue) {
      return "N/A";
    }

    return new Date(dateValue).toLocaleString();
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

const totalPages = Math.ceil(
  totalCount / pageSize
);

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
          Audit Logs
        </Typography>

      <Box sx={{ marginBottom: 3 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportCsv}
          disabled={logs.length === 0}
        >
          Export CSV
        </Button>
      </Box>       

        <Typography color="text.secondary" sx={{ marginBottom: 3 }}>
          Review recorded user actions and security management activities.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            {loading ? (
              <CircularProgress />
            ) : logs.length === 0 ? (
              <Typography>No audit logs found.</Typography>
            ) : (
              <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={
                            ordering === "user__username" ||
                            ordering === "-user__username"
                          }
                          direction={
                            ordering === "-user__username"
                              ? "desc"
                              : "asc"
                          }
                          onClick={() =>
                            handleSort("user__username")
                          }
                        >
                          <strong>User</strong>
                        </TableSortLabel>
                      </TableCell>

                      <TableCell>
                        <TableSortLabel
                          active={
                            ordering === "action" ||
                            ordering === "-action"
                          }
                          direction={
                            ordering === "-action"
                              ? "desc"
                              : "asc"
                          }
                          onClick={() => handleSort("action")}
                        >
                          <strong>Action</strong>
                        </TableSortLabel>
                      </TableCell>

                      <TableCell>
                        <TableSortLabel
                          active={
                            ordering === "timestamp" ||
                            ordering === "-timestamp"
                          }
                          direction={
                            ordering === "-timestamp"
                              ? "desc"
                              : "asc"
                          }
                          onClick={() => handleSort("timestamp")}
                        >
                          <strong>Date and Time</strong>
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.username || "System"}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
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
                  {lastVisibleRecord} of {totalCount} audit logs
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
                      setPageSize(
                        Number(event.target.value)
                      );
                      setPage(1);
                    }}
                    sx={{ minWidth: 140 }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={20}>20</MenuItem>
                    <MenuItem value={50}>50</MenuItem>
                  </TextField>

                  {totalPages > 0 && (
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(
                        event,
                        selectedPage
                      ) => {
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

export default AuditLogs;