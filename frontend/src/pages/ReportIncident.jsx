import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import api from "../api/axios";
import Navbar from "../components/Navbar";

function ReportIncident() {
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    severity: "",
    affected_asset: "",
  });

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await api.get("/assets/");
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setAssets(data);
      } catch (err) {
        setError("Failed to load assets.");
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.post("/incidents/", {
        ...formData,
        affected_asset: formData.affected_asset || null,
      });

      navigate("/incidents");
    } catch (err) {
      console.error("Failed to report incident:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
      } else {
        setError("Failed to submit the incident. Check all fields.");
      }
    } finally {
      setSubmitting(false);
    }
  };

    return (
    <Box sx={{ minHeight: "100vh", background: "#f1f5f9" }}>
      <Navbar />

      <Box sx={{ padding: 4, maxWidth: 850, margin: "auto" }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Report Cybersecurity Incident
        </Typography>

        <Typography color="text.secondary" sx={{ marginBottom: 3 }}>
          Submit information about suspicious activity or a security event.
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
                label="Incident description"
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

              {loadingAssets ? (
                <CircularProgress sx={{ marginTop: 2 }} />
              ) : (
                <TextField
                  name="affected_asset"
                  label="Affected asset"
                  value={formData.affected_asset}
                  onChange={handleChange}
                  fullWidth
                  select
                  margin="normal"
                >
                  <MenuItem value="">No affected asset selected</MenuItem>

                  {assets.map((asset) => (
                    <MenuItem key={asset.id} value={asset.id}>
                      {asset.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  marginTop: 3,
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Report Incident"}
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
      </Box>
    </Box>
  );
}

export default ReportIncident;