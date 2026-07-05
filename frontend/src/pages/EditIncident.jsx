import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Pagination,
  TextField,
  Typography,
} from "@mui/material";
import api from "../api/axios";
import Navbar from "../components/Navbar";

function EditIncident() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [assets, setAssets] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [timelineSubmitting, setTimelineSubmitting] = useState(false);
  const [timelineError, setTimelineError] = useState("");
  const [timelineTotalCount, setTimelineTotalCount] = useState(0);

  const [timelinePage, setTimelinePage] = useState(1);
  const [timelinePageSize, setTimelinePageSize] =
    useState(5);

  const [timelineOrdering, setTimelineOrdering] =
    useState("-created_at");

  const [timelineRefreshKey, setTimelineRefreshKey] =
    useState(0);

  const [timelineForm, setTimelineForm] = useState({
    update_type: "Note",
    message: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    severity: "",
    status: "",
    affected_asset: "",
    assigned_to: "",
  });

  useEffect(() => {
  const loadData = async () => {
    try {
      const [
        incidentResponse,
        assetsResponse,
        usersResponse,
      ] = await Promise.all([
        api.get(`/incidents/${id}/`),
        api.get("/assets/"),
        api.get("/users/assignable/"),
      ]);

      const incident = incidentResponse.data;

      setFormData({
        title: incident.title || "",
        description: incident.description || "",
        category: incident.category || "",
        severity: incident.severity || "",
        status: incident.status || "",
        affected_asset:
          incident.affected_asset || "",
        assigned_to:
          incident.assigned_to || "",
      });

      const assetData = Array.isArray(
        assetsResponse.data
      )
        ? assetsResponse.data
        : assetsResponse.data.results || [];

      setAssets(assetData);

      const usersData = Array.isArray(
        usersResponse.data
      )
        ? usersResponse.data
        : usersResponse.data.results || [];

      setAssignableUsers(usersData);
    } catch (err) {
      console.error(
        "Failed to load incident:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
      } else {
        setError("Failed to load the incident.");
      }
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [id, navigate]);

useEffect(() => {
  const fetchTimelineEntries = async () => {
    try {
      setTimelineLoading(true);
      setTimelineError("");

      const response = await api.get(
        "/incident-updates/",
        {
          params: {
            incident: id,
            page: timelinePage,
            page_size: timelinePageSize,
            ordering: timelineOrdering,
          },
        }
      );

      if (Array.isArray(response.data)) {
        setTimelineEntries(response.data);
        setTimelineTotalCount(
          response.data.length
        );
      } else {
        setTimelineEntries(
          response.data.results || []
        );

        setTimelineTotalCount(
          response.data.count || 0
        );
      }
    } catch (err) {
      console.error(
        "Failed to load incident timeline:",
        err
      );

      if (err.response?.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
      } else {
        setTimelineError(
          "Failed to load the incident timeline."
        );
      }
    } finally {
      setTimelineLoading(false);
    }
  };

  fetchTimelineEntries();
}, [
  id,
  navigate,
  timelinePage,
  timelinePageSize,
  timelineOrdering,
  timelineRefreshKey,
]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleTimelineChange = (event) => {
    const { name, value } = event.target;

    setTimelineForm((previousData) => ({
      ...previousData,
      [name]: value,
    }));
};

const handleTimelineSubmit = async (event) => {
  event.preventDefault();

  if (!timelineForm.message.trim()) {
    setTimelineError("Enter a timeline message.");
    return;
  }

  setTimelineSubmitting(true);
  setTimelineError("");

  try {
    await api.post("/incident-updates/", {
      incident: Number(id),
      update_type: timelineForm.update_type,
      message: timelineForm.message.trim(),
    });

    setTimelineForm({
      update_type: "Note",
      message: "",
    });

    setTimelinePage(1);
    setTimelineOrdering("-created_at");

    setTimelineRefreshKey(
      (currentValue) => currentValue + 1
    );

    setTimelineForm({
      update_type: "Note",
      message: "",
    });
  } catch (err) {
    console.error("Failed to add timeline entry:", err);

    if (err.response?.status === 401) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      navigate("/login");
    } else if (err.response?.status === 403) {
      setTimelineError(
        "You do not have permission to add timeline entries."
      );
    } else {
      setTimelineError(
        "Failed to add the timeline entry. Check the information."
      );
    }
  } finally {
    setTimelineSubmitting(false);
  }
};

const timelineTotalPages = Math.ceil(
  timelineTotalCount / timelinePageSize
);

const timelineFirstVisible =
  timelineTotalCount === 0
    ? 0
    : (timelinePage - 1) *
        timelinePageSize +
      1;

const timelineLastVisible = Math.min(
  timelinePage * timelinePageSize,
  timelineTotalCount
);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.patch(`/incidents/${id}/`, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        severity: formData.severity,
        status: formData.status,
        affected_asset: formData.affected_asset || null,
        assigned_to: formData.assigned_to || null,
      });

      navigate("/incidents");
    } catch (err) {
      console.error("Failed to update incident:", err);
      setError("Failed to update the incident. Check the form fields.");
    } finally {
      setSubmitting(false);
    }
  };

   if (loading) {
    return (
      <Box sx={{ padding: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <Navbar />

      <Box sx={{ padding: 4, maxWidth: 850, margin: "auto" }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Update Incident
        </Typography>

        <Typography color="text.secondary" sx={{ marginBottom: 3 }}>
          Change the incident status, severity, category, or affected asset.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ padding: 4 }}>
            <form onSubmit={handleSubmit}>
              <TextField
                name="title"
                label="Incident title"
                value={formData.title}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
              />

              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                required
                multiline
                rows={4}
                margin="normal"
              />

              <TextField
                name="category"
                label="Category"
                value={formData.category}
                onChange={handleChange}
                fullWidth
                required
                select
                margin="normal"
              >
                <MenuItem value="Phishing">Phishing</MenuItem>
                <MenuItem value="Malware">Malware</MenuItem>
                <MenuItem value="Unauthorized Access">
                  Unauthorized Access
                </MenuItem>
                <MenuItem value="Data Breach">Data Breach</MenuItem>
                <MenuItem value="Network Attack">Network Attack</MenuItem>
                <MenuItem value="Suspicious Activity">
                  Suspicious Activity
                </MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>

              <TextField
                name="severity"
                label="Severity"
                value={formData.severity}
                onChange={handleChange}
                fullWidth
                required
                select
                margin="normal"
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
              </TextField>

              <TextField
                name="status"
                label="Status"
                value={formData.status}
                onChange={handleChange}
                fullWidth
                required
                select
                margin="normal"
              >
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="Under Investigation">
                  Under Investigation
                </MenuItem>
                <MenuItem value="Escalated">Escalated</MenuItem>
                <MenuItem value="Resolved">Resolved</MenuItem>
                <MenuItem value="Closed">Closed</MenuItem>
              </TextField>

              <TextField
                name="affected_asset"
                label="Affected asset"
                value={formData.affected_asset}
                onChange={handleChange}
                fullWidth
                select
                margin="normal"
              >
                <MenuItem value="">No affected asset</MenuItem>

                {assets.map((asset) => (
                  <MenuItem key={asset.id} value={asset.id}>
                    {asset.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                name="assigned_to"
                label="Assigned analyst"
                value={formData.assigned_to}
                onChange={handleChange}
                fullWidth
                select
                margin="normal"
              >
                <MenuItem value="">
                  Unassigned
                </MenuItem>

                {assignableUsers.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.username} — {user.role}
                  </MenuItem>
                ))}
              </TextField>

              <Box sx={{ display: "flex", gap: 2, marginTop: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                >
                  {submitting ? "Updating..." : "Update Incident"}
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate("/incidents")}
                >
                  Cancel
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
        <Card sx={{ borderRadius: 3, marginTop: 4 }}>
  <CardContent sx={{ padding: 4 }}>
    <Typography variant="h5" fontWeight="bold" gutterBottom>
      Add Timeline Update
    </Typography>

    <Typography
      color="text.secondary"
      sx={{ marginBottom: 2 }}
    >
      Record investigation notes, evidence, assignment changes,
      status changes, or resolution information.
    </Typography>

    {timelineError && (
      <Alert severity="error" sx={{ marginBottom: 2 }}>
        {timelineError}
      </Alert>
    )}

    <form onSubmit={handleTimelineSubmit}>
      <TextField
        name="update_type"
        label="Update type"
        value={timelineForm.update_type}
        onChange={handleTimelineChange}
        fullWidth
        select
        margin="normal"
      >
        <MenuItem value="Note">
          Investigation Note
        </MenuItem>

        <MenuItem value="Status Change">
          Status Change
        </MenuItem>

        <MenuItem value="Assignment">
          Assignment Change
        </MenuItem>

        <MenuItem value="Evidence">
          Evidence Added
        </MenuItem>

        <MenuItem value="Resolution">
          Resolution Note
        </MenuItem>
      </TextField>

      <TextField
        name="message"
        label="Timeline message"
        value={timelineForm.message}
        onChange={handleTimelineChange}
        fullWidth
        required
        multiline
        minRows={4}
        margin="normal"
        placeholder="Describe the investigation activity or finding."
      />

      <Button
        type="submit"
        variant="contained"
        disabled={timelineSubmitting}
        sx={{ marginTop: 2 }}
      >
        {timelineSubmitting
          ? "Adding Update..."
          : "Add Timeline Update"}
      </Button>
    </form>
  </CardContent>
</Card>
<Card sx={{ borderRadius: 3, marginTop: 4 }}>
  <CardContent sx={{ padding: 4 }}>
    <Typography variant="h5" fontWeight="bold" gutterBottom>
      Incident Response Timeline
    </Typography>

    <Typography
      color="text.secondary"
      sx={{ marginBottom: 3 }}
    >
      Chronological investigation and response activity for this
      incident.
    </Typography>

<Box
  sx={{
    display: "flex",
    gap: 2,
    flexWrap: "wrap",
    marginBottom: 3,
  }}
>
  <TextField
    select
    size="small"
    label="Sort timeline"
    value={timelineOrdering}
    onChange={(event) => {
      setTimelineOrdering(
        event.target.value
      );
      setTimelinePage(1);
    }}
    sx={{ minWidth: 190 }}
  >
    <MenuItem value="-created_at">
      Newest first
    </MenuItem>

    <MenuItem value="created_at">
      Oldest first
    </MenuItem>

    <MenuItem value="update_type">
      Update type A–Z
    </MenuItem>

    <MenuItem value="-update_type">
      Update type Z–A
    </MenuItem>

    <MenuItem value="user__username">
      User A–Z
    </MenuItem>

    <MenuItem value="-user__username">
      User Z–A
    </MenuItem>
  </TextField>

  <TextField
    select
    size="small"
    label="Entries per page"
    value={timelinePageSize}
    onChange={(event) => {
      setTimelinePageSize(
        Number(event.target.value)
      );
      setTimelinePage(1);
    }}
    sx={{ minWidth: 170 }}
  >
    <MenuItem value={5}>5</MenuItem>
    <MenuItem value={10}>10</MenuItem>
    <MenuItem value={20}>20</MenuItem>
  </TextField>
</Box>

    {timelineLoading ? (
  <CircularProgress />
) : timelineEntries.length === 0 ? (
  <Typography color="text.secondary">
    No timeline updates have been recorded yet.
  </Typography>
) : (
  <>
    <Box>
      {timelineEntries.map((entry, index) => (
        <Box key={entry.id}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "flex-start",
              paddingY: 2,
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#1976d2",
                marginTop: 1,
                flexShrink: 0,
              }}
            />

            <Box sx={{ flexGrow: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  alignItems: "center",
                  flexWrap: "wrap",
                  marginBottom: 1,
                }}
              >
                <Chip
                  label={
                    entry.update_type_display ||
                    entry.update_type
                  }
                  size="small"
                  color="primary"
                  variant="outlined"
                />

                <Typography
                  variant="body2"
                  fontWeight="bold"
                >
                  {entry.username || "System"}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {entry.created_at
                    ? new Date(
                        entry.created_at
                      ).toLocaleString()
                    : ""}
                </Typography>
              </Box>

              <Typography
                sx={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {entry.message}
              </Typography>
            </Box>
          </Box>

          {index < timelineEntries.length - 1 && (
            <Divider />
          )}
        </Box>
      ))}
    </Box>

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
        Showing {timelineFirstVisible}–
        {timelineLastVisible} of{" "}
        {timelineTotalCount} timeline entries
      </Typography>

      {timelineTotalPages > 0 && (
        <Pagination
          count={timelineTotalPages}
          page={timelinePage}
          onChange={(event, selectedPage) => {
            setTimelinePage(selectedPage);
          }}
          color="primary"
          showFirstButton
          showLastButton
        />
      )}
    </Box>
  </>
)}
  </CardContent>
</Card>
      </Box>
    </Box>
  );
}

export default EditIncident;