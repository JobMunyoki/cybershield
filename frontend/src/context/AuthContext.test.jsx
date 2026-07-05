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
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import {
  AuthProvider,
  useAuth,
} from "./AuthContext";

import api from "../api/axios";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

function AuthTestConsumer() {
  const {
    user,
    loading,
    refreshUser,
    logout,
  } = useAuth();

  if (loading) {
    return <div>Loading user...</div>;
  }

  return (
    <div>
      <div>
        {user
          ? `${user.username} — ${user.role}`
          : "No authenticated user"}
      </div>

      <button
        type="button"
        onClick={refreshUser}
      >
        Refresh User
      </button>

      <button
        type="button"
        onClick={logout}
      >
        Logout
      </button>
    </div>
  );
}

function renderAuthContext() {
  return render(
    <AuthProvider>
      <AuthTestConsumer />
    </AuthProvider>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  test("does not request a user when no tokens exist", async () => {
    renderAuthContext();

    expect(
      await screen.findByText(
        "No authenticated user"
      )
    ).toBeInTheDocument();

    expect(api.get).not.toHaveBeenCalled();
  });

  test("loads the current user when an access token exists", async () => {
    window.localStorage.setItem(
      "access",
      "test-access-token"
    );

    api.get.mockResolvedValue({
      data: {
        id: 1,
        username: "admin",
        role: "Admin",
      },
    });

    renderAuthContext();

    expect(
      await screen.findByText(
        "admin — Admin"
      )
    ).toBeInTheDocument();

    expect(api.get).toHaveBeenCalledWith(
      "/auth/me/"
    );
  });

  test("clears the user when the current-user request fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    window.localStorage.setItem(
      "access",
      "expired-access-token"
    );

    api.get.mockRejectedValue(
      new Error("Unauthorized")
    );

    renderAuthContext();

    expect(
      await screen.findByText(
        "No authenticated user"
      )
    ).toBeInTheDocument();

    expect(api.get).toHaveBeenCalledWith(
      "/auth/me/"
    );

    consoleErrorSpy.mockRestore();
  });

  test("logout removes tokens and clears the authenticated user", async () => {
    const user = userEvent.setup();

    window.localStorage.setItem(
      "access",
      "test-access-token"
    );

    window.localStorage.setItem(
      "refresh",
      "test-refresh-token"
    );

    api.get.mockResolvedValue({
      data: {
        id: 1,
        username: "admin",
        role: "Admin",
      },
    });

    renderAuthContext();

    expect(
      await screen.findByText(
        "admin — Admin"
      )
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Logout",
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "No authenticated user"
        )
      ).toBeInTheDocument();
    });

    expect(
      window.localStorage.getItem("access")
    ).toBeNull();

    expect(
      window.localStorage.getItem("refresh")
    ).toBeNull();
  });
});