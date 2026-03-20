import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationApi } from "../services/notificationApi";
import { springApi } from "../services/springApi";
import "./Portal.css";
import "./Checkout.css";

function formatDateTime(isoDate) {
  return new Date(isoDate).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Checkout() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [event, setEvent] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
          setError(loadError.message || "Failed to load checkout details.");
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

  const totalAmount = useMemo(() => {
    if (!event) {
      return 0;
    }

    return Number(event.price) * Number(quantity);
  }, [event, quantity]);

  const handleOrderSubmit = async (submitEvent) => {
    submitEvent.preventDefault();

    if (!event || !token) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await springApi.placeOrder(token, {
        eventId: event.id,
        quantity,
      });

      try {
        await notificationApi.notifyOrderCreated({
          eventId: event.id,
          recipient: user?.email,
          recipientUserId: user?.id,
          organizerUserId: event.organizerId,
          purchaserName:
            `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
            user?.email ||
            "A customer",
          quantity,
          eventTitle: event.title,
          ticketCode: response.order.ticketCode,
        });
      } catch {
        // Keep checkout success even if the notification service is unavailable.
      }

      navigate("/my-orders", {
        state: {
          successMessage: `Booking confirmed for ${event.title}.`,
        },
      });
    } catch (submitError) {
      setError(submitError.message || "Order placement failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="section">
        <div className="container">
          <div className="card">
            <h2>Preparing checkout...</h2>
            <p className="muted">Loading ticket & event details.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="section">
        <div className="container">
          <div className="alert error">{error || "Event not found."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-page section">
      <div className="container">
        <div className="portal-header">
          <div>
            <h1 className="page-title">Checkout</h1>
            <p className="page-subtitle">
              Confirm attendee details & place the order.
            </p>
          </div>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        <div className="checkout-grid">
          <form className="form-shell" onSubmit={handleOrderSubmit}>
            <h2 className="panel-title">Attendee Details</h2>
            <div className="form-row">
              <div className="field">
                <label>First name</label>
                <input value={user?.firstName || ""} disabled />
              </div>
              <div className="field">
                <label>Last name</label>
                <input value={user?.lastName || ""} disabled />
              </div>
            </div>

            <div className="field" style={{ marginTop: "0.8rem" }}>
              <label>Email</label>
              <input value={user?.email || ""} disabled />
            </div>

            <div className="field" style={{ marginTop: "0.8rem" }}>
              <label>Ticket quantity</label>
              <input
                type="number"
                min="1"
                max={Math.max(event.seatsLeft, 1)}
                value={quantity}
                onChange={(inputEvent) => {
                  const value = Number(inputEvent.target.value);
                  if (!value || value < 1) {
                    setQuantity(1);
                    return;
                  }

                  if (value > event.seatsLeft) {
                    setQuantity(event.seatsLeft);
                    return;
                  }

                  setQuantity(value);
                }}
              />
              <small className="muted">
                {event.seatsLeft} seats currently available
              </small>
            </div>

            <div className="portal-actions" style={{ marginTop: "1rem" }}>
              <button className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Placing order..." : "Place Order"}
              </button>
            </div>
          </form>

          <aside className="form-shell">
            <h2 className="panel-title">Order Summary</h2>
            <div className="summary-row">
              <span>Event</span>
              <strong>{event.title}</strong>
            </div>
            <div className="summary-row">
              <span>Schedule</span>
              <strong>{formatDateTime(event.startAt)}</strong>
            </div>
            <div className="summary-row">
              <span>Venue</span>
              <strong>{event.venue?.name}</strong>
            </div>
            <div className="summary-row">
              <span>Price per ticket</span>
              <strong>INR {event.price}</strong>
            </div>
            <div className="summary-row">
              <span>Quantity</span>
              <strong>{quantity}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>INR {totalAmount}</strong>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
