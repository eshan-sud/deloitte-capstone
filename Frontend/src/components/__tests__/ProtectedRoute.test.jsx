import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute";
import { useAuth } from "../../context/AuthContext";

vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

function renderWithRoutes(route = "/protected") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  test("shows loading state while session is being resolved", () => {
    useAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      role: "GUEST",
    });

    renderWithRoutes();

    expect(screen.getByText(/Loading your session/i)).toBeInTheDocument();
  });

  test("redirects unauthenticated users to login", () => {
    useAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      role: "GUEST",
    });

    renderWithRoutes();

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  test("redirects unauthorized role to dashboard", () => {
    useAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      role: "CUSTOMER",
    });

    renderWithRoutes();

    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });

  test("renders children for authorized users", () => {
    useAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      role: "ADMIN",
    });

    renderWithRoutes();

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
