import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SecurityIcon from "@mui/icons-material/Security";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const canManageSecurity =
    user?.role === "Admin" || user?.role === "Security Analyst";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleDrawerToggle = () => {
    setMobileOpen((previousValue) => !previousValue);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            <SecurityIcon sx={{ marginRight: 1 }} />

            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              CyberShield
            </Typography>
          </Box>

          {/* Desktop navigation */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1,
            }}
          >
            <Button color="inherit" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>

            <Button color="inherit" onClick={() => navigate("/assets")}>
              Assets
            </Button>

            <Button color="inherit" onClick={() => navigate("/incidents")}>
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
              <Button color="inherit" onClick={() => navigate("/audit-logs")}>
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
                <Typography variant="body2">{user.username}</Typography>

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
          </Box>

          {/* Mobile menu icon */}
          <IconButton
            color="inherit"
            edge="end"
            onClick={handleDrawerToggle}
            sx={{ display: { xs: "flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer menu */}
      <Drawer anchor="right" open={mobileOpen} onClose={handleDrawerToggle}>
        <Box sx={{ width: 260 }}>
          <Box sx={{ padding: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SecurityIcon color="primary" />

              <Typography variant="h6" fontWeight="bold">
                CyberShield
              </Typography>
            </Box>

            {user && (
              <Box sx={{ marginTop: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Logged in as
                </Typography>

                <Typography variant="body1" fontWeight="bold">
                  {user.username}
                </Typography>

                <Chip
                  label={user.role}
                  size="small"
                  sx={{
                    marginTop: 1,
                    backgroundColor: "#1976d2",
                    color: "white",
                    fontWeight: "bold",
                  }}
                />
              </Box>
            )}
          </Box>

          <Divider />

          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigate("/dashboard")}>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigate("/assets")}>
                <ListItemText primary="Assets" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigate("/incidents")}>
                <ListItemText primary="Incidents" />
              </ListItemButton>
            </ListItem>

            {canManageSecurity && (
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleNavigate("/vulnerabilities")}
                >
                  <ListItemText primary="Vulnerabilities" />
                </ListItemButton>
              </ListItem>
            )}

            {canManageSecurity && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigate("/audit-logs")}>
                  <ListItemText primary="Audit Logs" />
                </ListItemButton>
              </ListItem>
            )}

            <Divider sx={{ marginY: 1 }} />

            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default Navbar;