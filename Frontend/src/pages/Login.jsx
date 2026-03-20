import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const redirectPath = location.state?.from?.pathname || "/dashboard";
  const notice = location.state?.notice || "";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors((prev) => ({ ...prev, submit: "" }));

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setErrors({
        submit: error.message || "Login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-content">
          <div className="login-form-section">
            <div className="form-header">
              <h1 className="form-title">Welcome Back</h1>
              <p className="form-subtitle">Sign in to manage your events</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {notice ? <div className="info-message">{notice}</div> : null}

              {errors.submit && (
                <div className="error-message">
                  <span className="error-icon">!</span>
                  {errors.submit}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? "error" : ""}`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <span className="field-error">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? "error" : ""}`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <span className="field-error">{errors.password}</span>
                )}
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <div className="form-footer">
                <p>
                  Don't have an account?
                  <Link
                    to="/signup"
                    className="signup-link"
                    style={{ marginLeft: "0.25rem" }}
                  >
                    Sign up for free
                  </Link>
                </p>
              </div>
            </form>

            <div className="divider">
              <span>Demo accounts</span>
            </div>
            <div className="demo-credentials">
              <div className="demo-item">
                <span className="demo-tag">ADMIN</span>
                <span>admin@eventnest.io / Admin@123</span>
              </div>
              <div className="demo-item">
                <span className="demo-tag">ORG</span>
                <span>organizer@eventnest.io / Organizer@123</span>
              </div>
              <div className="demo-item">
                <span className="demo-tag">CUST</span>
                <span>customer@eventnest.io / Customer@123</span>
              </div>
            </div>
          </div>

          <div className="login-image-section">
            <div className="image-content">
              <h2>Bring Your Community Together</h2>
              <p>
                Run registrations, event timelines, & updates from one place.
              </p>
              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Quick attendee tracking</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Simple organizer workflow</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span>Spring Boot auth integration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
