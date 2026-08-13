import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import { Visibility, VisibilityOff } from "@mui/icons-material";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const demoAccounts = [
    {
      label: "Security Analyst Demo",
      username: "demo_analyst",
      password: "Demo@12345",
      role: "Security Analyst",
      description: "Can manage assets, incidents, vulnerabilities, and audit logs.",
    },
    {
      label: "Staff Demo",
      username: "demo_staff",
      password: "Demo@12345",
      role: "Staff",
      description: "Can report and view assigned or personal incidents.",
    },
  ];

  const useDemoAccount = (demoUsername, demoPassword) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setError("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
        username,
        password,
      });

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      await refreshUser();

      navigate("/dashboard");
    } catch (err) {
      setError("Invalid username or password. Please try again.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#0f172a",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 460, borderRadius: 3 }}>
        <CardContent sx={{ padding: { xs: 3, sm: 4 } }}>
          <Box sx={{ textAlign: "center", marginBottom: 3 }}>
            <SecurityIcon sx={{ fontSize: 50, color: "#1976d2" }} />

            <Typography variant="h4" fontWeight="bold">
              CyberShield
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Cybersecurity Incident & Vulnerability Management System
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 2,
              padding: 2,
              marginBottom: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Demo Access for Recruiters
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ marginBottom: 2 }}
            >
              Use a demo account to explore CyberShield without creating an
              account.
            </Typography>

            <Stack spacing={1.5}>
              {demoAccounts.map((account) => (
                <Box
                  key={account.username}
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    padding: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {account.label}
                      </Typography>

                      <Chip
                        label={account.role}
                        size="small"
                        color="primary"
                        sx={{ marginTop: 0.5 }}
                      />
                    </Box>

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() =>
                        useDemoAccount(account.username, account.password)
                      }
                    >
                      Use Demo
                    </Button>
                  </Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", marginTop: 1 }}
                  >
                    {account.description}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      marginTop: 0.5,
                      fontFamily: "monospace",
                    }}
                  >
                    Username: {account.username} | Password: {account.password}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Divider sx={{ marginBottom: 2 }} />

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              slotProps={{
                htmlInput: {
                  "aria-label": "Username",
                },
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              slotProps={{
                htmlInput: {
                  "aria-label": "Password",
                },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() =>
                          setShowPassword((previousValue) => !previousValue)
                        }
                        onMouseDown={(event) => event.preventDefault()}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              sx={{ marginTop: 2 }}
            >
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;