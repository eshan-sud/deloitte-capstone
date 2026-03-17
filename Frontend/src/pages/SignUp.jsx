import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./SignUp.css";

function SignUp() {
  const navigate = useNavigate();
  const { isAuthenticated, register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

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

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, & number";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms & conditions";
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
      // TEMPORARY MOCK API CALL: replace with POST /api/auth/register later.
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrors({
        submit: error.message || "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-content">
          <div className="signup-form-section">
            <div className="form-header">
              <h1 className="form-title">Create Account</h1>
              <p className="form-subtitle">
                Create your EventNest organizer account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="signup-form">
              {errors.submit && (
                <div className="error-message">
                  <span className="error-icon">!</span>
                  {errors.submit}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`form-input ${errors.firstName ? "error" : ""}`}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <span className="field-error">{errors.firstName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`form-input ${errors.lastName ? "error" : ""}`}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <span className="field-error">{errors.lastName}</span>
                  )}
                </div>
              </div>

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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-input ${errors.password ? "error" : ""}`}
                    placeholder="Create a strong password"
                  />
                  {errors.password && (
                    <span className="field-error">{errors.password}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`form-input ${errors.confirmPassword ? "error" : ""}`}
                    placeholder="Re-enter password"
                  />
                  {errors.confirmPassword && (
                    <span className="field-error">
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                  />
                  <span>
                    I agree to the{" "}
                    <Link to="/signup" className="link">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/signup" className="link">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <span className="field-error">{errors.agreeToTerms}</span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>

              <div className="form-footer">
                <p>
                  Already have an account?{" "}
                  <Link to="/login" className="login-link">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>

          <div className="signup-image-section">
            <div className="image-content">
              <h2>Launch Events Faster</h2>
              <p>Get a starter workspace for your event management system.</p>
              <div className="benefits-list">
                <div className="benefit-item">
                  <span className="benefit-icon">FAST</span>
                  <div>
                    <h4>Fast setup</h4>
                    <p>Registration flow ready in minutes</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">PLAN</span>
                  <div>
                    <h4>Event-first workflow</h4>
                    <p>Designed around sessions, speakers, attendees</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">SAFE</span>
                  <div>
                    <h4>Secure by default</h4>
                    <p>Spring Security + JWT backend support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
