import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DownloadIcon from "@mui/icons-material/Download";
import { exportToCsv } from "../utils/exportCsv";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  Paper,
  Alert,
} from "@mui/material";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

function Assets() {
  const navigate = useNavigate();
  const { user } = useAuth();
const isAdmin = user?.role === "Admin";
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [ordering, setOrdering] = useState("-created_at");

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams();

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      if (typeFilter) {
        params.append("asset_type", typeFilter);
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
        ? `/assets/?${queryString}`
        : "/assets/";

      const response = await api.get(endpoint);

      console.log("Assets response:", response.data);

      if (Array.isArray(response.data)) {
        setAssets(response.data);
        setTotalCount(response.data.length);
      } else {
        setAssets(response.data.results || []);
        setTotalCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch assets", error);

      if (error.response && error.response.status === 401) {
        setError("Your session has expired. Please log in again.");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
      } else {
        setError("Failed to load assets from the backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssets();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    searchTerm,
    typeFilter,
    riskFilter,
    statusFilter,
    page,
    pageSize,
    ordering,
  ]);
  
  const handleExportCsv = () => {
  const today = new Date().toISOString().slice(0, 10);

  exportToCsv({
    filename: `cybershield-assets-${today}.csv`,

    columns: [
      {
        label: "Asset Name",
        key: "name",
      },
      {
        label: "Asset Type",
        key: "asset_type",
      },
      {
        label: "IP Address",
        getValue: (asset) => asset.ip_address || "N/A",
      },
      {
        label: "Department",
        getValue: (asset) =>
          asset.owner_department || "N/A",
      },
      {
        label: "Risk Level",
        key: "risk_level",
      },
      {
        label: "Status",
        key: "status",
      },
      {
        label: "Created At",
        getValue: (asset) =>
          asset.created_at
            ? new Date(asset.created_at).toLocaleString()
            : "N/A",
      },
    ],

    rows: assets,
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
          Asset Management
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ marginBottom: 3 }}>
          View all company systems, devices, websites, databases, and network assets.
        </Typography>

<Box
  sx={{
    display: "flex",
    gap: 2,
    marginBottom: 3,
    flexWrap: "wrap",
  }}
>
  {isAdmin && (
    <Button
      variant="contained"
      onClick={() => navigate("/assets/new")}
    >
      Add Asset
    </Button>
  )}

  <Button
    variant="outlined"
    startIcon={<DownloadIcon />}
    onClick={handleExportCsv}
    disabled={assets.length === 0}
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
    label="Search assets"
    value={searchTerm}
    onChange={(event) => {
      setSearchTerm(event.target.value);
      setPage(1);
    }}
    placeholder="Search name, IP address, or department"
    sx={{ minWidth: 300 }}
  />

  <TextField
    select
    label="Asset type"
    value={typeFilter}
    onChange={(event) => {
      setTypeFilter(event.target.value);
      setPage(1);
    }}
    sx={{ minWidth: 180 }}
  >
    <MenuItem value="">All asset types</MenuItem>
    <MenuItem value="Laptop">Laptop</MenuItem>
    <MenuItem value="Server">Server</MenuItem>
    <MenuItem value="Router">Router</MenuItem>
    <MenuItem value="Database">Database</MenuItem>
    <MenuItem value="Website">Website</MenuItem>
    <MenuItem value="POS Machine">POS Machine</MenuItem>
    <MenuItem value="Other">Other</MenuItem>
  </TextField>

  <TextField
    select
    label="Risk level"
    value={riskFilter}
    onChange={(event) => {
      setRiskFilter(event.target.value);
      setPage(1);
    }}
    sx={{ minWidth: 170 }}
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
    <MenuItem value="Active">Active</MenuItem>
    <MenuItem value="Inactive">Inactive</MenuItem>
    <MenuItem value="Under Maintenance">
      Under Maintenance
    </MenuItem>
    <MenuItem value="Retired">Retired</MenuItem>
  </TextField>

  <Button
    variant="outlined"
    onClick={() => {
      setSearchTerm("");
      setTypeFilter("");
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
            ) : assets.length === 0 ? (
              <Typography>
                No assets match the selected filters.
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
                              ordering === "name" ||
                              ordering === "-name"
                            }
                          direction={
                            ordering === "-name" ? "desc" : "asc"
                          }
                          onClick={() => handleSort("name")}
                        >
                          <strong>Name</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={
                            ordering === "asset_type" ||
                            ordering === "-asset_type"
                          }
                          direction={
                            ordering === "-asset_type"
                              ? "desc"
                              : "asc"
                          }
                          onClick={() => handleSort("asset_type")}
                        >
                          <strong>Type</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={
                            ordering === "ip_address" ||
                            ordering === "-ip_address"
                          }
                          direction={
                            ordering === "-ip_address"
                              ? "desc"
                              : "asc"
                          }
                          onClick={() => handleSort("ip_address")}
                        >
                          <strong>IP Address</strong>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={
                            ordering === "owner_department" ||
                            ordering === "-owner_department"
                          }
                          direction={
                            ordering === "-owner_department"
                              ? "desc"
                              : "asc"
                          }
                          onClick={() =>
                            handleSort("owner_department")
                          }
                        >
                          <strong>Department</strong>
                        </TableSortLabel>
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
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell>{asset.asset_type}</TableCell>
                        <TableCell>{asset.ip_address || "N/A"}</TableCell>
                        <TableCell>{asset.owner_department || "N/A"}</TableCell>
                        <TableCell>{asset.risk_level}</TableCell>
                        <TableCell>{asset.status}</TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => navigate(`/assets/${asset.id}/edit`)}
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
                  {lastVisibleRecord} of {totalCount} assets
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

export default Assets;