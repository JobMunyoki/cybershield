import {
  AppBar,
  Box,
  Button,
  Chip,
  Toolbar,
  Typography,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const canManageSecurity =
    user?.role === "Admin" ||
    user?.role === "Security Analyst";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <SecurityIcon sx={{ marginRight: 1 }} />

        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          CyberShield
        </Typography>

        <Button
          color="inherit"
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </Button>

        <Button
          color="inherit"
          onClick={() => navigate("/assets")}
        >
          Assets
        </Button>

        <Button
          color="inherit"
          onClick={() => navigate("/incidents")}
        >
          Incidents
        </Button>

        {canManageSecurity && (
          <Button
            color="inherit"
            onClick={() => navigate("/vulnerabilities")}
          >
            Vulnerabilities
          </Button>
        )}

        {canManageSecurity && (
          <Button
            color="inherit"
            onClick={() => navigate("/audit-logs")}
          >
            Audit Logs
          </Button>
        )}

        {user && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              marginLeft: 2,
              marginRight: 2,
            }}
          >
            <Typography variant="body2">
              {user.username}
            </Typography>

            <Chip
              label={user.role}
              size="small"
              sx={{
                backgroundColor: "white",
                color: "#1976d2",
                fontWeight: "bold",
              }}
            />
          </Box>
        )}

        <Button color="inherit" onClick={handleLogout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;