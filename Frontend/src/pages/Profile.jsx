import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Portal.css";

function formatDateTime(value) {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Profile() {
  const { isAdmin, refreshUser, updateProfile, user } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
    });
  }, [user]);

  const handleChange = (changeEvent) => {
    const { name, value } = changeEvent.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError("");

    try {
      const nextUser = await refreshUser();

      if (nextUser) {
        setFormData({
          firstName: nextUser.firstName || "",
          lastName: nextUser.lastName || "",
          email: nextUser.email || "",
        });
      }
    } catch (refreshError) {
      setError(refreshError.message || "Failed to refresh profile.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name & last name are required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please provide a valid email address.");
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile(formData);
      setSuccess("Profile updated successfully.");
    } catch (saveError) {
      setError(saveError.message || "Profile update failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="portal-page section">
      <div className="container">
        <div className="portal-header">
          <div>
            <h1 className="page-title">My Profile</h1>
            <p className="page-subtitle">
              Update account details & manage your role-specific access.
            </p>
          </div>
          <div className="portal-actions">
            <span className="status-pill active">Role: {user?.role}</span>
            <button className="btn btn-outline" onClick={handleRefresh}>
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error ? <div className="alert error">{error}</div> : null}
        {success ? <div className="alert success">{success}</div> : null}

        <div className="portal-grid">
          <section className="form-shell portal-col-8">
            <h2 className="panel-title">Account Information</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="firstName">First name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="field">
                  <label htmlFor="lastName">Last name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="field full" style={{ marginTop: "0.8rem" }}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="portal-actions" style={{ marginTop: "1rem" }}>
                <button className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </section>

          <aside className="form-shell portal-col-4">
            <h2 className="panel-title">Account Summary</h2>
            <p className="portal-subtle">User ID: {user?.id}</p>
            <p className="portal-subtle">
              Created: {formatDateTime(user?.createdAt)}
            </p>
            <p className="portal-subtle">
              Last update: {formatDateTime(user?.updatedAt)}
            </p>

            {isAdmin ? (
              <div style={{ marginTop: "1rem" }}>
                <h3 className="panel-title" style={{ fontSize: "0.95rem" }}>
                  Admin Controls
                </h3>
                <div className="portal-actions">
                  <Link className="btn btn-outline" to="/admin/users">
                    User Management
                  </Link>
                  <Link className="btn btn-outline" to="/admin/reports">
                    Reports
                  </Link>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Profile;
