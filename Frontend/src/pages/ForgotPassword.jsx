import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { springApi } from "../services/springApi";
import "./ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError("Email is invalid.");
      return;
    }

    setLoading(true);

    try {
      const response = await springApi.forgotPassword({
        email: email.trim().toLowerCase(),
      });
      setResult(response);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to start the password reset flow right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemoToken = () => {
    if (!result?.resetToken) {
      return;
    }

    navigate(`/reset-password?token=${encodeURIComponent(result.resetToken)}`);
  };

  return (
    <div className="auth-panel-page">
      <div className="auth-panel-card">
        <div className="auth-panel-header">
          <h1>Forgot Password</h1>
          <p>
            Request a reset token for your account. In local demo mode the token
            is shown on-screen instead of being emailed.
          </p>
        </div>

        <form className="auth-panel-form" onSubmit={handleSubmit}>
          {error ? <div className="error-message">{error}</div> : null}

          {result ? (
            <div className="success-message">
              If an account exists for that email, a reset token has been
              prepared.
            </div>
          ) : null}

          <label className="auth-label" htmlFor="forgot-email">
            Email Address
          </label>
          <input
            id="forgot-email"
            type="email"
            className="auth-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <button
            className="btn btn-primary btn-full"
            type="submit"
            disabled={loading}
          >
            {loading ? "Preparing reset token..." : "Send Reset Instructions"}
          </button>
        </form>

        {result?.resetTokenIssued ? (
          <div className="auth-helper-card">
            <h2>Local Demo Token</h2>
            <p>Use this token to complete the reset flow in development.</p>
            <div className="auth-token-box">{result.resetToken}</div>
            <p className="auth-meta">
              Expires at {new Date(result.expiresAt).toLocaleString()}.
            </p>
            <button
              className="btn btn-outline btn-full"
              type="button"
              onClick={handleUseDemoToken}
            >
              Continue To Reset Password
            </button>
          </div>
        ) : null}

        <div className="auth-panel-footer">
          <Link to="/login" className="auth-inline-link">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
