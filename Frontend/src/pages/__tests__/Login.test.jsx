import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../Login";
import { useAuth } from "../../context/AuthContext";

vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

describe("Login page", () => {
  test("shows validation errors when form is empty", async () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      login: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  test("submits valid credentials to auth context", async () => {
    const loginMock = vi.fn().mockResolvedValue({ role: "CUSTOMER" });

    useAuth.mockReturnValue({
      isAuthenticated: false,
      login: loginMock,
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    await userEvent.type(
      screen.getByLabelText(/email address/i),
      " user@example.com ",
    );
    await userEvent.type(screen.getByLabelText(/password/i), "Secret123");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Secret123",
      });
    });
  });
});
