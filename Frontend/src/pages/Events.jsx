import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { springApi } from "../services/springApi";
import "./Portal.css";
import "./Events.css";

function formatDateTime(isoDate) {
  return new Date(isoDate).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const CATEGORY_OPTIONS = ["ALL", "Tech", "Design", "Community", "Workshop"];

function Events() {
  const { canManageEvents, isAdmin, isAuthenticated, token, user } = useAuth();

  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadEvents() {
      setIsLoading(true);
      setError("");

      try {
        const response = await springApi.getEvents(
          {
            query,
            category,
            status,
            includeDrafts: canManageEvents,
          },
          token,
        );

        if (!ignore) {
          setEvents(response.events || []);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || "Unable to fetch events.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      ignore = true;
    };
  }, [canManageEvents, category, query, status, token]);

  const canEdit = (event) => {
    if (!canManageEvents) {
      return false;
    }

    if (isAdmin) {
      return true;
    }

    return event.organizerId === user?.id;
  };

  return (
    <div className="events-page section">
      <div className="container">
        <div className="events-header">
          <div>
            <h1 className="page-title">Discover Events</h1>
            <p className="page-subtitle">
              Search, filter, and book upcoming experiences from one catalog.
            </p>
          </div>

          {canManageEvents ? (
            <Link className="btn btn-primary" to="/create-event">
              Create Event
            </Link>
          ) : null}
        </div>

        <div className="events-toolbar card">
          <div className="events-search">
            <label htmlFor="eventSearch">Search</label>
            <input
              id="eventSearch"
              className="toolbar-input"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, venue, or description"
            />
          </div>

          <div className="events-filter-row">
            {CATEGORY_OPTIONS.map((categoryValue) => (
              <button
                key={categoryValue}
                className={category === categoryValue ? "chip active" : "chip"}
                onClick={() => setCategory(categoryValue)}
                type="button"
              >
                {categoryValue}
              </button>
            ))}
          </div>

          {canManageEvents ? (
            <div className="events-status-filter">
              <label htmlFor="statusFilter">Status</label>
              <select
                id="statusFilter"
                className="toolbar-input"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="ALL">ALL</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>
          ) : null}
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        {isLoading ? (
          <div className="card">
            <h2>Loading events...</h2>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              Fetching schedule and availability.
            </p>
          </div>
        ) : null}

        {!isLoading && events.length === 0 ? (
          <div className="empty-state card">
            <h3>No events found</h3>
            <p>Try changing your filters or create a new event.</p>
          </div>
        ) : null}

        {!isLoading && events.length > 0 ? (
          <div className="events-grid">
            {events.map((event) => (
              <article key={event.id} className="event-card card">
                <div className="event-top">
                  <span className="event-category">{event.category}</span>
                  <span className={`status-pill ${event.status.toLowerCase()}`}>
                    {event.status}
                  </span>
                </div>

                <h3>{event.title}</h3>
                <p className="event-meta">{formatDateTime(event.startAt)}</p>
                <p className="event-venue">{event.venue?.name}</p>
                <p className="event-description">{event.description}</p>

                <div className="event-footer">
                  <span>{event.seatsLeft} seats left</span>
                  <span>INR {event.price}</span>
                </div>

                <div className="event-actions">
                  <Link className="btn btn-outline" to={`/events/${event.id}`}>
                    View Details
                  </Link>

                  {canEdit(event) ? (
                    <Link
                      className="btn btn-primary"
                      to={`/events/${event.id}/edit`}
                    >
                      Edit
                    </Link>
                  ) : isAuthenticated ? (
                    <Link
                      className="btn btn-secondary"
                      to={`/checkout/${event.id}`}
                    >
                      Book
                    </Link>
                  ) : (
                    <Link className="btn btn-secondary" to="/login">
                      Login To Book
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Events;
