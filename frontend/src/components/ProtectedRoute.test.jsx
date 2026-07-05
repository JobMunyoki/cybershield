import {
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";

import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderProtectedRoute = ({
    allowedRoles,
    initialPath = "/protected",
  } = {}) => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/login"
            element={<div>Login destination</div>}
          />

          <Route
            path="/dashboard"
            element={<div>Dashboard destination</div>}
          />

          <Route
            path="/protected"
            element={
              <ProtectedRoute
                allowedRoles={allowedRoles}
              >
                <div>Protected content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );
  };

  test("shows the loading message while authentication is loading", () => {
    useAuth.mockReturnValue({
      user: null,
      loading: true,
    });

    renderProtectedRoute();

    expect(
      screen.getByText("Loading CyberShield...")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Protected content")
    ).not.toBeInTheDocument();
  });

  test("redirects an unauthenticated user to login", () => {
    useAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    renderProtectedRoute();

    expect(
      screen.getByText("Login destination")
    ).toBeInTheDocument();
  });

  test("allows an authenticated user when no roles are required", () => {
    useAuth.mockReturnValue({
      user: {
        username: "staff_user",
        role: "Staff",
      },
      loading: false,
    });

    renderProtectedRoute();

    expect(
      screen.getByText("Protected content")
    ).toBeInTheDocument();
  });

  test("allows a user whose role is permitted", () => {
    useAuth.mockReturnValue({
      user: {
        username: "admin",
        role: "Admin",
      },
      loading: false,
    });

    renderProtectedRoute({
      allowedRoles: [
        "Admin",
        "Security Analyst",
      ],
    });

    expect(
      screen.getByText("Protected content")
    ).toBeInTheDocument();
  });

  test("redirects a user whose role is not permitted", () => {
    useAuth.mockReturnValue({
      user: {
        username: "staff_user",
        role: "Staff",
      },
      loading: false,
    });

    renderProtectedRoute({
      allowedRoles: [
        "Admin",
        "Security Analyst",
      ],
    });

    expect(
      screen.getByText("Dashboard destination")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Protected content")
    ).not.toBeInTheDocument();
  });
});