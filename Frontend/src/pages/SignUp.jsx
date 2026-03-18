import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./SignUp.css";

const LEGAL_DOCUMENTS = {
  terms: {
    title: "Terms of Service",
    sections: [
      {
        heading: "1. Platform Use",
        body: "EventNest is provided for managing events, registrations, and attendee communication. You agree to use the platform only for lawful event operations and accurate record keeping.",
      },
      {
        heading: "2. Organizer Responsibilities",
        body: "Organizers are responsible for event accuracy, venue coordination, published schedules, pricing, and attendee-facing announcements. Misleading or duplicate listings may be removed.",
      },
      {
        heading: "3. Account Security",
        body: "You are responsible for keeping your credentials secure and for any activity performed through your account. Notify the project team if you believe your account has been compromised.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        heading: "1. Data Collected",
        body: "The application stores profile details, authentication data, event records, orders, and notification history needed to operate the capstone workflow.",
      },
      {
        heading: "2. How Data Is Used",
        body: "Your data is used to authenticate users, manage bookings, support organizer workflows, and generate administrative reports across the project services.",
      },
      {
        heading: "3. Demo Environment Notice",
        body: "This sample project is intended for educational and demonstration use. Avoid entering sensitive personal data because local development environments may not provide production-grade security controls.",
      },
    ],
  },
};

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
  const [activeDocument, setActiveDocument] = useState("");

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

  const legalDocument = activeDocument ? LEGAL_DOCUMENTS[activeDocument] : null;

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
                  <span className="checkbox-copy">
                    I agree to the{" "}
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => setActiveDocument("terms")}
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => setActiveDocument("privacy")}
                    >
                      Privacy Policy
                    </button>
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

      {legalDocument ? (
        <div
          className="legal-modal-backdrop"
          onClick={() => setActiveDocument("")}
        >
          <div
            className="legal-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="legal-modal-header">
              <div>
                <p className="legal-modal-kicker">Sample Legal Copy</p>
                <h2 id="legal-modal-title">{legalDocument.title}</h2>
              </div>
              <button
                type="button"
                className="legal-modal-close"
                onClick={() => setActiveDocument("")}
              >
                Close
              </button>
            </div>

            <div className="legal-modal-body">
              {legalDocument.sections.map((section) => (
                <section key={section.heading} className="legal-section">
                  <h3>{section.heading}</h3>
                  <p>{section.body}</p>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SignUp;
