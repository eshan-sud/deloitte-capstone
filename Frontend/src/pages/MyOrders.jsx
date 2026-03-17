import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { springApi } from "../services/springApi";
import "./Portal.css";

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function MyOrders() {
  const location = useLocation();
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancellingOrderId, setIsCancellingOrderId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadOrders() {
      setIsLoading(true);
      setError("");

      try {
        const response = await springApi.getMyOrders(token);
        if (!ignore) {
          setOrders(response.orders);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || "Failed to load orders.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      ignore = true;
    };
  }, [token]);

  const handleCancelOrder = async (orderId) => {
    setIsCancellingOrderId(orderId);
    setError("");

    try {
      const response = await springApi.cancelOrder(token, orderId);

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? response.order : order,
        ),
      );
    } catch (cancelError) {
      setError(cancelError.message || "Failed to cancel order.");
    } finally {
      setIsCancellingOrderId("");
    }
  };

  return (
    <div className="portal-page section">
      <div className="container">
        <div className="portal-header">
          <div>
            <h1 className="page-title">My Orders</h1>
            <p className="page-subtitle">
              Manage your ticket bookings and download-ready order references.
            </p>
          </div>
        </div>

        {location.state?.successMessage ? (
          <div className="alert success">{location.state.successMessage}</div>
        ) : null}

        {error ? <div className="alert error">{error}</div> : null}

        {isLoading ? (
          <div className="card">
            <h2>Loading orders...</h2>
            <p className="muted">Fetching your booking history.</p>
          </div>
        ) : null}

        {!isLoading && orders.length === 0 ? (
          <div className="empty-state">
            <h3>No bookings yet</h3>
            <p>
              Start by exploring upcoming events and placing your first order.
            </p>
            <Link className="btn btn-primary" to="/events">
              Explore Events
            </Link>
          </div>
        ) : null}

        {!isLoading && orders.length > 0 ? (
          <div className="list">
            {orders.map((order) => (
              <article className="list-item" key={order.id}>
                <div className="list-item-main">
                  <p className="list-item-title">
                    {order.event?.title || "Event removed"}
                  </p>
                  <p className="list-item-meta">
                    Order ID: {order.id} | Ticket: {order.ticketCode} |{" "}
                    {order.quantity} ticket(s)
                  </p>
                  <p className="list-item-meta">
                    Placed on {formatDate(order.createdAt)} | Total INR{" "}
                    {order.totalAmount}
                  </p>
                </div>

                <div className="list-actions">
                  <span className={`status-pill ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>

                  {order.event ? (
                    <Link
                      className="btn btn-outline"
                      to={`/events/${order.event.id}`}
                    >
                      View Event
                    </Link>
                  ) : null}

                  {order.status === "CONFIRMED" ? (
                    <button
                      className="btn btn-outline"
                      disabled={isCancellingOrderId === order.id}
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      {isCancellingOrderId === order.id
                        ? "Cancelling..."
                        : "Cancel"}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default MyOrders;
