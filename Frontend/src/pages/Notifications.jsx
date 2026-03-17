import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { notificationApi } from "../services/notificationApi";
import "./Portal.css";

function formatNotificationDate(isoDate) {
  return new Date(isoDate).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Notifications() {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  useEffect(() => {
    let ignore = false;

    async function loadNotifications() {
      setIsLoading(true);
      setError("");

      try {
        const response = await notificationApi.getMyNotifications(user);
        if (!ignore) {
          setNotifications(response.notifications);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError.message || "Unable to load notifications.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      ignore = true;
    };
  }, [user?.email, user?.id]);

  const handleMarkRead = async (notificationId) => {
    try {
      const response = await notificationApi.markNotificationRead(
        user,
        notificationId,
      );

      setNotifications((prevNotifications) =>
        prevNotifications.map((item) =>
          item.id === notificationId ? response.notification : item,
        ),
      );
    } catch (markError) {
      setError(markError.message || "Failed to update notification.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllNotificationsRead(user);
      setNotifications((prevNotifications) =>
        prevNotifications.map((item) => ({ ...item, isRead: true })),
      );
    } catch (markError) {
      setError(markError.message || "Failed to update notifications.");
    }
  };

  return (
    <div className="portal-page section">
      <div className="container">
        <div className="portal-header">
          <div>
            <h1 className="page-title">Notification Center</h1>
            <p className="page-subtitle">
              Stay updated on booking confirmations, reminders, and platform
              alerts.
            </p>
          </div>
          <div className="portal-actions">
            <span className="status-pill draft">Unread: {unreadCount}</span>
            <button className="btn btn-outline" onClick={handleMarkAllRead}>
              Mark All Read
            </button>
          </div>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        {isLoading ? (
          <div className="card">
            <h2>Loading notifications...</h2>
            <p className="muted">
              Please wait while we fetch your activity feed.
            </p>
          </div>
        ) : null}

        {!isLoading && notifications.length === 0 ? (
          <div className="empty-state">
            <h3>No notifications yet</h3>
            <p>Important order and event updates will appear here.</p>
          </div>
        ) : null}

        {!isLoading && notifications.length > 0 ? (
          <div className="list">
            {notifications.map((notification) => (
              <article className="list-item" key={notification.id}>
                <div className="list-item-main">
                  <p className="list-item-title">{notification.title}</p>
                  <p className="list-item-meta">{notification.message}</p>
                  <p className="list-item-meta">
                    {formatNotificationDate(notification.createdAt)}
                  </p>
                </div>

                <div className="list-actions">
                  <span
                    className={`status-pill ${notification.isRead ? "active" : "draft"}`}
                  >
                    {notification.isRead ? "Read" : "Unread"}
                  </span>

                  {!notification.isRead ? (
                    <button
                      className="btn btn-outline"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      Mark Read
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

export default Notifications;
