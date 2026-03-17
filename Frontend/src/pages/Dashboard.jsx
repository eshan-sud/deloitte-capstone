import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dashboardApi } from "../services/dashboardApi";
import "./Portal.css";
import "./Dashboard.css";

function formatDateTime(isoDate) {
  return new Date(isoDate).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatKpiLabel(label) {
  return label
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase())
    .trim();
}

function Dashboard() {
  const { role, token, user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !user) {
      setSummary(null);
      setIsLoading(false);
      return;
    }

    let ignore = false;

    async function loadDashboard() {
      setIsLoading(true);
      setError("");

      try {
        const response = await dashboardApi.getDashboardSummary(token, user);

        if (!ignore) {
          setSummary(response);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || "Failed to load dashboard data.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [token, user?.id, user?.role]);

  const quickActions = useMemo(() => {
    if (role === "ADMIN") {
      return [
        {
          to: "/admin/reports",
          title: "Reports",
          description: "Review revenue and variance",
        },
        {
          to: "/admin/users",
          title: "Users",
          description: "Manage account roles and status",
        },
        {
          to: "/create-event",
          title: "Create Event",
          description: "Publish a new event listing",
        },
      ];
    }

    if (role === "ORGANIZER") {
      return [
        {
          to: "/create-event",
          title: "New Event",
          description: "Create and publish event pages",
        },
        {
          to: "/events",
          title: "Manage Events",
          description: "Edit your event inventory",
        },
        {
          to: "/notifications",
          title: "Notifications",
          description: "Track registration updates",
        },
      ];
    }

    return [
      {
        to: "/events",
        title: "Explore Events",
        description: "Find upcoming experiences",
      },
      {
        to: "/my-orders",
        title: "My Orders",
        description: "Review your ticket bookings",
      },
      {
        to: "/profile",
        title: "Profile",
        description: "Manage account details",
      },
    ];
  }, [role]);

  const kpiEntries = useMemo(() => {
    if (!summary?.kpis) {
      return [];
    }

    return Object.entries(summary.kpis);
  }, [summary]);

  return (
    <div className="dashboard-page section">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1 className="page-title">
              Welcome back, {user?.firstName || "User"}
            </h1>
            <p className="page-subtitle">
              Here is your {role.toLowerCase()} operations snapshot.
            </p>
          </div>
          {role === "ADMIN" ? (
            <Link to="/admin/reports" className="btn btn-primary">
              Open Admin Reports
            </Link>
          ) : role === "ORGANIZER" ? (
            <Link to="/create-event" className="btn btn-primary">
              Create Event
            </Link>
          ) : (
            <Link to="/events" className="btn btn-primary">
              Browse Events
            </Link>
          )}
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        {isLoading ? (
          <div className="card">
            <h2>Loading dashboard...</h2>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              Pulling your latest KPIs and schedule view.
            </p>
          </div>
        ) : null}

        {!isLoading && summary ? (
          <div className="kpi-grid" style={{ marginBottom: "1rem" }}>
            {kpiEntries.map(([key, value]) => (
              <article key={key} className="kpi-card">
                <p className="kpi-label">{formatKpiLabel(key)}</p>
                <p className="kpi-value">{value}</p>
              </article>
            ))}
          </div>
        ) : null}

        <div className="dashboard-grid">
          <section className="form-shell">
            <div className="panel-heading-row">
              <h2 className="panel-title">Upcoming Events</h2>
              <Link className="btn btn-outline" to="/events">
                View All
              </Link>
            </div>

            {!isLoading && summary?.upcomingEvents?.length === 0 ? (
              <p className="muted">No upcoming events available.</p>
            ) : (
              <div className="list">
                {(summary?.upcomingEvents || []).map((event) => (
                  <article className="list-item" key={event.id}>
                    <div className="list-item-main">
                      <p className="list-item-title">{event.title}</p>
                      <p className="list-item-meta">
                        {formatDateTime(event.startAt)}
                      </p>
                      <p className="list-item-meta">
                        {event.venue?.name} | {event.seatsLeft} seats left
                      </p>
                    </div>
                    <div className="list-actions">
                      <span
                        className={`status-pill ${event.status.toLowerCase()}`}
                      >
                        {event.status}
                      </span>
                      <Link
                        className="btn btn-outline"
                        to={`/events/${event.id}`}
                      >
                        Open
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="form-shell">
            <h2 className="panel-title">Quick Actions</h2>
            <div className="action-cards">
              {quickActions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="quick-action-card"
                >
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                </Link>
              ))}
            </div>

            <div className="dashboard-note">
              <p className="muted">
                This dashboard aggregates live data from the reporting,
                notification, and Spring event services.
              </p>
            </div>
          </aside>
        </div>

        {role === "ADMIN" ? (
          <section className="card" style={{ marginTop: "1rem" }}>
            <h2 className="panel-title">Governance Checklist</h2>
            <ul className="governance-list">
              <li>Review inactive users and role assignments weekly.</li>
              <li>Validate budget variance reports for outlier events.</li>
              <li>Track cancellation trends and platform health indicators.</li>
            </ul>
          </section>
        ) : null}

        {role === "ORGANIZER" ? (
          <section className="card" style={{ marginTop: "1rem" }}>
            <h2 className="panel-title">Organizer Checklist</h2>
            <ul className="governance-list">
              <li>Publish draft events at least 72 hours before launch.</li>
              <li>Monitor seat utilization and venue capacity constraints.</li>
              <li>
                Respond to attendee notifications and cancellations daily.
              </li>
            </ul>
          </section>
        ) : null}

        {role === "CUSTOMER" ? (
          <section className="card" style={{ marginTop: "1rem" }}>
            <h2 className="panel-title">Booking Tips</h2>
            <ul className="governance-list">
              <li>Save high-demand events to your schedule early.</li>
              <li>Check notification updates for venue/time adjustments.</li>
              <li>Use profile settings to keep contact details up to date.</li>
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default Dashboard;
