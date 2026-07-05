import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import api from "../api/axios";
import Navbar from "../components/Navbar";

function EditAsset() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    asset_type: "",
    ip_address: "",
    owner_department: "",
    risk_level: "",
    status: "",
  });

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const response = await api.get(`/assets/${id}/`);
        const asset = response.data;

        setFormData({
          name: asset.name || "",
          asset_type: asset.asset_type || "",
          ip_address: asset.ip_address || "",
          owner_department: asset.owner_department || "",
          risk_level: asset.risk_level || "",
          status: asset.status || "",
        });
      } catch (err) {
        console.error("Failed to load asset:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          navigate("/login");
        } else {
          setError("Failed to load the asset.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [id, navigate]);

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
      await api.patch(`/assets/${id}/`, {
        ...formData,
        ip_address: formData.ip_address || null,
        owner_department: formData.owner_department || null,
      });

      navigate("/assets");
    } catch (err) {
      console.error("Failed to update asset:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        navigate("/login");
      } else {
        setError("Failed to update the asset. Check the information.");
      }
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
          Update Asset
        </Typography>

        <Typography color="text.secondary" sx={{ marginBottom: 3 }}>
          Update the asset information, risk level, ownership, or status.
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
                name="name"
                label="Asset name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
              />

              <TextField
                name="asset_type"
                label="Asset type"
                value={formData.asset_type}
                onChange={handleChange}
                fullWidth
                required
                select
                margin="normal"
              >
                <MenuItem value="Laptop">Laptop</MenuItem>
                <MenuItem value="Server">Server</MenuItem>
                <MenuItem value="Router">Router</MenuItem>
                <MenuItem value="Database">Database</MenuItem>
                <MenuItem value="Website">Website</MenuItem>
                <MenuItem value="POS Machine">POS Machine</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>

              <TextField
                name="ip_address"
                label="IP address"
                value={formData.ip_address}
                onChange={handleChange}
                fullWidth
                margin="normal"
                placeholder="Example: 192.168.1.10"
              />

              <TextField
                name="owner_department"
                label="Owner department"
                value={formData.owner_department}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />

              <TextField
                name="risk_level"
                label="Risk level"
                value={formData.risk_level}
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
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Under Maintenance">
                  Under Maintenance
                </MenuItem>
                <MenuItem value="Retired">Retired</MenuItem>
              </TextField>

              <Box sx={{ display: "flex", gap: 2, marginTop: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                >
                  {submitting ? "Updating..." : "Update Asset"}
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate("/assets")}
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

export default EditAsset;