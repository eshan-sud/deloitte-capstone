import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { springApi } from "../services/springApi";
import "./ForgotPassword.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    token: searchParams.get("token") || "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token") || "";
    setFormData((previous) => ({
      ...previous,
      token: previous.token || tokenFromUrl,
    }));
  }, [searchParams]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.token.trim()) {
      setError("Reset token is required.");
      return;
    }

    if (!formData.password) {
      setError("Password is required.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError("Password must contain uppercase, lowercase, and number.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await springApi.resetPassword({
        token: formData.token.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      navigate("/login", {
        replace: true,
        state: {
          notice: "Password updated. Sign in with your new password.",
        },
      });
    } catch (resetError) {
      setError(resetError.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-panel-page">
      <div className="auth-panel-card">
        <div className="auth-panel-header">
          <h1>Reset Password</h1>
          <p>
            Enter the reset token and choose a new password for your account.
          </p>
        </div>

        <form className="auth-panel-form" onSubmit={handleSubmit}>
          {error ? <div className="error-message">{error}</div> : null}

          <label className="auth-label" htmlFor="reset-token">
            Reset Token
          </label>
          <input
            id="reset-token"
            name="token"
            className="auth-input"
            value={formData.token}
            onChange={handleChange}
            placeholder="Paste your reset token"
          />

          <label className="auth-label" htmlFor="reset-password">
            New Password
          </label>
          <input
            id="reset-password"
            name="password"
            type="password"
            className="auth-input"
            value={formData.password}
            onChange={handleChange}
            placeholder="Choose a strong password"
            autoComplete="new-password"
          />

          <label className="auth-label" htmlFor="reset-confirm-password">
            Confirm Password
          </label>
          <input
            id="reset-confirm-password"
            name="confirmPassword"
            type="password"
            className="auth-input"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
          />

          <button
            className="btn btn-primary btn-full"
            type="submit"
            disabled={loading}
          >
            {loading ? "Updating password..." : "Reset Password"}
          </button>
        </form>

        <div className="auth-panel-footer">
          <Link to="/forgot-password" className="auth-inline-link">
            Need another token?
          </Link>
          <Link to="/login" className="auth-inline-link">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
