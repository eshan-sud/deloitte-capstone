import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { springApi } from "../services/springApi";
import "./Portal.css";

const ROLE_FILTERS = ["ALL", "ADMIN", "ORGANIZER", "CUSTOMER"];

function UserManagement() {
  const { token, user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadUsers() {
      setIsLoading(true);
      setError("");

      try {
        const response = await springApi.listUsers(token);
        if (!ignore) {
          setUsers(response.users || []);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || "Failed to fetch users.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();

    return () => {
      ignore = true;
    };
  }, [token]);

  const filteredUsers = useMemo(() => {
    return users.filter((entry) => {
      const rolePass = roleFilter === "ALL" ? true : entry.role === roleFilter;
      const query = searchTerm.trim().toLowerCase();
      const searchPass = query
        ? [entry.firstName, entry.lastName, entry.email, entry.role]
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;

      return rolePass && searchPass;
    });
  }, [users, roleFilter, searchTerm]);

  async function handleStatusUpdate(targetUser, isActive) {
    if (!targetUser || targetUser.id === currentUser?.id) {
      setError("You cannot change your own account status from this screen.");
      return;
    }

    setUpdatingUserId(targetUser.id);
    setError("");
    setNotice("");

    try {
      const updated = await springApi.updateUserStatus(token, targetUser.id, {
        isActive,
      });
      setUsers((prev) =>
        prev.map((entry) =>
          entry.id === updated.user.id ? updated.user : entry,
        ),
      );
      setNotice(
        `${updated.user.firstName} ${updated.user.lastName} is now ${updated.user.isActive ? "active" : "inactive"}.`,
      );
    } catch (updateError) {
      setError(updateError.message || "Unable to update account status.");
    } finally {
      setUpdatingUserId("");
    }
  }

  async function handleRoleUpdate(targetUser, role) {
    if (!targetUser || targetUser.id === currentUser?.id) {
      setError("You cannot modify your own role from this screen.");
      return;
    }

    setUpdatingUserId(targetUser.id);
    setError("");
    setNotice("");

    try {
      const updated = await springApi.updateUserRole(
        token,
        targetUser.id,
        role,
      );
      setUsers((prev) =>
        prev.map((entry) =>
          entry.id === updated.user.id ? updated.user : entry,
        ),
      );
      setNotice(
        `${updated.user.firstName} ${updated.user.lastName} role changed to ${updated.user.role}.`,
      );
    } catch (updateError) {
      setError(updateError.message || "Unable to update role.");
    } finally {
      setUpdatingUserId("");
    }
  }

  return (
    <div className="portal-page section">
      <div className="container">
        <div className="portal-header">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">
              Admin-only controls for account lifecycle & role governance.
            </p>
          </div>
          <div className="portal-actions">
            <Link className="btn btn-outline" to="/admin/reports">
              View Reports
            </Link>
          </div>
        </div>

        <section className="card" style={{ marginBottom: "1rem" }}>
          <h2 className="panel-title">Filters</h2>
          <div className="form-row user-filter-grid">
            <div className="field">
              <label htmlFor="searchUser">Search by name, email, or role</label>
              <input
                id="searchUser"
                type="text"
                placeholder="Type to filter users"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="roleFilter">Role</label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                {ROLE_FILTERS.map((roleValue) => (
                  <option key={roleValue} value={roleValue}>
                    {roleValue}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {error ? <div className="alert error">{error}</div> : null}
        {notice ? <div className="alert success">{notice}</div> : null}

        <section className="card">
          <h2 className="panel-title">Accounts</h2>

          {isLoading ? (
            <p className="muted">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="muted">No users matched your filters.</p>
          ) : (
            <table className="table-shell">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((entry) => {
                  const isSelf = entry.id === currentUser?.id;
                  const isBusy = updatingUserId === entry.id;
                  const fullName =
                    `${entry.firstName || ""} ${entry.lastName || ""}`.trim();

                  return (
                    <tr key={entry.id}>
                      <td>{fullName || "Unnamed User"}</td>
                      <td>{entry.email}</td>
                      <td>
                        <select
                          value={entry.role}
                          disabled={isSelf || isBusy}
                          onChange={(event) =>
                            handleRoleUpdate(entry, event.target.value)
                          }
                        >
                          <option value="CUSTOMER">CUSTOMER</option>
                          <option value="ORGANIZER">ORGANIZER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${entry.isActive ? "active" : "cancelled"}`}
                        >
                          {entry.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="inline-actions">
                          {entry.isActive ? (
                            <button
                              className="btn btn-outline"
                              disabled={isSelf || isBusy}
                              onClick={() => handleStatusUpdate(entry, false)}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              className="btn btn-outline"
                              disabled={isSelf || isBusy}
                              onClick={() => handleStatusUpdate(entry, true)}
                            >
                              Activate
                            </button>
                          )}
                          {isSelf ? (
                            <span className="muted">Current user</span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

export default UserManagement;
