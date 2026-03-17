import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { springApi } from "../services/springApi";
import "./Portal.css";
import "./EventDetails.css";

function formatDateTime(isoDate) {
  return new Date(isoDate).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function EventDetails() {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { canManageEvents, isAdmin, isAuthenticated, token, user } = useAuth();

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadEvent() {
      setIsLoading(true);
      setError("");

      try {
        const response = await springApi.getEventById(eventId);
        if (!ignore) {
          setEvent(response.event);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || "Failed to load event details.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadEvent();

    return () => {
      ignore = true;
    };
  }, [eventId]);

  const isEventOwner = useMemo(() => {
    if (!event || !user) {
      return false;
    }

    return event.organizerId === user.id;
  }, [event, user]);

  const canEditEvent = canManageEvents && (isAdmin || isEventOwner);

  const handleDelete = async () => {
    if (!event || !token) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this event? This will remove related registrations in this demo mode.",
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await springApi.deleteEvent(token, event.id);
      navigate("/events");
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete event.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="section">
        <div className="container">
          <div className="card">
            <h2>Loading event details...</h2>
            <p className="muted">
              Please wait while we fetch the event summary.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="section">
        <div className="container">
          <div className="alert error">{error}</div>
          <Link className="btn btn-outline" to="/events">
            Back To Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-page event-details-page section">
      <div className="container">
        {location.state?.successMessage ? (
          <div className="alert success">{location.state.successMessage}</div>
        ) : null}

        {location.state?.warningMessage ? (
          <div className="alert error">{location.state.warningMessage}</div>
        ) : null}

        {error ? <div className="alert error">{error}</div> : null}

        <div className="event-hero card">
          <div className="event-hero-main">
            <div className="event-hero-top">
              <span className={`status-pill ${event.status.toLowerCase()}`}>
                {event.status}
              </span>
              <span className="event-category-chip">{event.category}</span>
            </div>

            <h1 className="page-title">{event.title}</h1>
            <p className="page-subtitle">{event.description}</p>

            <div className="event-meta-grid">
              <div>
                <p className="event-meta-label">Starts</p>
                <p className="event-meta-value">
                  {formatDateTime(event.startAt)}
                </p>
              </div>
              <div>
                <p className="event-meta-label">Ends</p>
                <p className="event-meta-value">
                  {formatDateTime(event.endAt)}
                </p>
              </div>
              <div>
                <p className="event-meta-label">Venue</p>
                <p className="event-meta-value">{event.venue?.name}</p>
              </div>
              <div>
                <p className="event-meta-label">Organizer</p>
                <p className="event-meta-value">{event.organizerName}</p>
              </div>
            </div>
          </div>

          <div className="event-hero-side">
            <div className="event-price">INR {event.price}</div>
            <p className="muted">per ticket</p>

            <div className="capacity-block">
              <div className="capacity-row">
                <span>Booked</span>
                <strong>{event.seatsBooked}</strong>
              </div>
              <div className="capacity-row">
                <span>Seats left</span>
                <strong>{event.seatsLeft}</strong>
              </div>
              <div className="capacity-track">
                <div
                  className="capacity-fill"
                  style={{
                    width: `${Math.min(
                      Math.round((event.seatsBooked / event.capacity) * 100),
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="portal-actions">
              {canEditEvent ? (
                <>
                  <Link
                    className="btn btn-primary"
                    to={`/events/${event.id}/edit`}
                  >
                    Edit Event
                  </Link>
                  <button
                    className="btn btn-outline"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Event"}
                  </button>
                </>
              ) : isAuthenticated ? (
                <Link className="btn btn-primary" to={`/checkout/${event.id}`}>
                  Book Tickets
                </Link>
              ) : (
                <Link className="btn btn-primary" to="/login">
                  Login To Book
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: "1rem" }}>
          <h2 className="panel-title">Venue Details</h2>
          <div className="card-grid">
            <div>
              <p className="muted">Venue name</p>
              <p>{event.venue?.name}</p>
            </div>
            <div>
              <p className="muted">Address</p>
              <p>{event.venue?.address}</p>
            </div>
            <div>
              <p className="muted">Venue capacity</p>
              <p>{event.venue?.capacity} attendees</p>
            </div>
            <div>
              <p className="muted">Venue cost/hour</p>
              <p>INR {event.venue?.pricePerHour}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;
