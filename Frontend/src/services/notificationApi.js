import {
  extractEnvelope,
  getErrorMessage,
  notificationsClient,
} from "./apiClient";

function buildIdentityPayload(user) {
  const recipientUserId = user?.id ? String(user.id) : "";
  const recipient = user?.email ? String(user.email).trim().toLowerCase() : "";

  if (!recipientUserId && !recipient) {
    throw new Error("User context is required to load notifications.");
  }

  return {
    recipientUserId: recipientUserId || undefined,
    recipient: recipient || undefined,
  };
}

function normalizeNotification(notification = {}) {
  return {
    id: String(notification.id || notification._id || ""),
    title:
      notification.title || notification.payload?.subject || "Notification",
    message: notification.message || notification.payload?.message || "",
    type: notification.type || "GENERIC",
    isRead: Boolean(notification.isRead),
    createdAt:
      notification.createdAt || notification.sentAt || new Date().toISOString(),
  };
}

export const notificationApi = {
  async getMyNotifications(user) {
    try {
      const response = await notificationsClient.get("/v1/notifications/my", {
        params: buildIdentityPayload(user),
      });
      const data = extractEnvelope(response);

      return {
        notifications: (data?.notifications || []).map(normalizeNotification),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async markNotificationRead(user, notificationId) {
    try {
      const response = await notificationsClient.patch(
        `/v1/notifications/${notificationId}/read`,
        buildIdentityPayload(user),
      );
      const data = extractEnvelope(response);

      return {
        notification: normalizeNotification(data?.notification),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async markAllNotificationsRead(user) {
    try {
      await notificationsClient.patch(
        "/v1/notifications/read-all",
        buildIdentityPayload(user),
      );

      return { success: true };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async notifyOrderCreated(payload) {
    try {
      const response = await notificationsClient.post(
        "/v1/notifications/event-order-created",
        payload,
      );

      return extractEnvelope(response);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async sendReminder(payload) {
    try {
      const response = await notificationsClient.post(
        "/v1/notifications/reminder",
        payload,
      );

      return extractEnvelope(response);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
