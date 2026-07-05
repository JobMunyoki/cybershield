import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";
import axios from "axios";

import Login from "./Login";
import { useAuth } from "../context/AuthContext";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("Login page", () => {
  const refreshUser = vi.fn();

  const renderLoginPage = () => {
    return render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/dashboard"
            element={
              <div>Dashboard destination</div>
            }
          />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();

    useAuth.mockReturnValue({
      refreshUser,
    });

    refreshUser.mockResolvedValue();
  });

  test("displays the login form", () => {
    renderLoginPage();

    expect(
      screen.getByRole("heading", {
        name: "CyberShield",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Username")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Password")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Login",
      })
    ).toBeInTheDocument();
  });

  test("shows an error when login fails", async () => {
    const user = userEvent.setup();

    axios.post.mockRejectedValue(
      new Error("Invalid credentials")
    );

    renderLoginPage();

    await user.type(
      screen.getByLabelText("Username"),
      "wrong_user"
    );

    await user.type(
      screen.getByLabelText("Password"),
      "wrong_password"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText(
        "Invalid username or password. Please try again."
      )
    ).toBeInTheDocument();

    expect(
      window.localStorage.getItem("access")
    ).toBeNull();

    expect(refreshUser).not.toHaveBeenCalled();
  });

  test("stores tokens and redirects after successful login", async () => {
    const user = userEvent.setup();

    axios.post.mockResolvedValue({
      data: {
        access: "test-access-token",
        refresh: "test-refresh-token",
      },
    });

    renderLoginPage();

    await user.type(
      screen.getByLabelText("Username"),
      "admin"
    );

    await user.type(
      screen.getByLabelText("Password"),
      "StrongPassword123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "Dashboard destination"
        )
      ).toBeInTheDocument();
    });

    expect(axios.post).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/auth/login/",
      {
        username: "admin",
        password: "StrongPassword123!",
      }
    );

    expect(
      window.localStorage.getItem("access")
    ).toBe("test-access-token");

    expect(
      window.localStorage.getItem("refresh")
    ).toBe("test-refresh-token");

    expect(refreshUser).toHaveBeenCalledTimes(1);
  });
});