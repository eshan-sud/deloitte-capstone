require("dotenv").config();

const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { connectDb, Notification } = require("./db");
const { sendEmail } = require("./email");

const app = express();

const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGINS = (
  process.env.CLIENT_ORIGINS ||
  process.env.CLIENT_ORIGIN ||
  "http://localhost:5173,http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  return !origin || CLIENT_ORIGINS.includes(origin);
}

function buildIdentityFilter(identity = {}) {
  const values = [];

  if (identity.recipientUserId) {
    values.push({ recipientUserId: String(identity.recipientUserId) });
  }

  if (identity.recipient) {
    values.push({ recipient: String(identity.recipient).trim().toLowerCase() });
  }

  if (values.length === 0) {
    return null;
  }

  return values.length === 1 ? values[0] : { $or: values };
}

function serializeNotification(notification) {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title:
      notification.title || notification.payload?.subject || notification.type,
    message: notification.message || notification.payload?.message || "",
    recipient: notification.recipient,
    recipientUserId: notification.recipientUserId,
    channel: notification.channel,
    status: notification.status,
    isRead: Boolean(notification.isRead),
    createdAt: notification.createdAt,
    readAt: notification.readAt,
    sentAt: notification.sentAt,
    payload: notification.payload || {},
  };
}

async function createNotification({
  type = "GENERIC",
  recipient = null,
  recipientUserId = null,
  channel = "in-app",
  title,
  message,
  payload = {},
  status = "SENT",
  sentAt = new Date(),
  error = null,
}) {
  return Notification.create({
    type,
    recipient: recipient ? String(recipient).trim().toLowerCase() : null,
    recipientUserId: recipientUserId ? String(recipientUserId) : null,
    channel,
    title,
    message,
    payload,
    status,
    sentAt,
    error,
  });
}

async function sendEmailWithRetry(message, maxAttempts = 2) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await sendEmail(message);
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    }
  }

  throw lastError;
}

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again shortly.",
  },
});

app.use("/api", limiter);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "notification-service",
    message: "Node.js backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/v1/notifications/test", (req, res) => {
  const { channel = "email", recipient = "demo@example.com" } = req.body || {};

  res.status(202).json({
    success: true,
    message: "Notification accepted for processing",
    data: {
      channel,
      recipient,
      queuedAt: new Date().toISOString(),
    },
  });
});

// --- Production-grade endpoints ---

// Send notification (email)
app.post("/api/v1/notifications/send", async (req, res) => {
  const {
    type = "GENERIC",
    recipient,
    recipientUserId,
    channel = "email",
    subject,
    title,
    message,
    payload = {},
  } = req.body || {};

  if ((!recipient && !recipientUserId) || !(subject || title) || !message) {
    return res.status(400).json({
      success: false,
      message:
        "recipient or recipientUserId, title or subject, & message are required",
    });
  }

  const notificationTitle = title || subject;

  try {
    let emailResult = null;
    if (channel === "email" && recipient) {
      emailResult = await sendEmailWithRetry({
        to: recipient,
        subject: subject || title,
        text: message,
        html: `<p>${message}</p>`,
      });
    }

    const notif = await createNotification({
      type,
      recipient,
      recipientUserId,
      channel,
      title: notificationTitle,
      message,
      payload: { ...payload, subject: subject || title, message },
      status: "SENT",
      sentAt: new Date(),
    });

    res.status(202).json({
      success: true,
      message: "Notification sent",
      data: {
        notification: serializeNotification(notif),
        emailResult,
      },
    });
  } catch (err) {
    try {
      await createNotification({
        type,
        recipient,
        recipientUserId,
        channel,
        title: notificationTitle,
        message,
        payload: { ...payload, subject: subject || title, message },
        status: "FAILED",
        sentAt: null,
        error: err.message,
      });
    } catch {
      // Ignore secondary logging failure so the primary error still returns.
    }

    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: err.message,
    });
  }
});

// Event order created trigger
app.post("/api/v1/notifications/event-order-created", async (req, res) => {
  const {
    recipient,
    recipientUserId,
    organizerRecipient,
    organizerUserId,
    purchaserName = "A customer",
    quantity = 1,
    eventTitle,
    ticketCode,
  } = req.body || {};

  if (
    (!recipient &&
      !recipientUserId &&
      !organizerRecipient &&
      !organizerUserId) ||
    !eventTitle ||
    !ticketCode
  ) {
    return res.status(400).json({
      success: false,
      message:
        "At least one recipient, plus eventTitle & ticketCode, are required",
    });
  }

  try {
    const notifications = [];

    if (recipient || recipientUserId) {
      const customerTitle = "Order confirmed";
      const customerMessage = `Order confirmed for ${eventTitle}. Ticket: ${ticketCode}.`;

      if (recipient) {
        await sendEmailWithRetry({
          to: recipient,
          subject: `Your booking for ${eventTitle}`,
          text: customerMessage,
          html: `<p>${customerMessage}</p>`,
        });
      }

      const customerNotification = await createNotification({
        type: "ORDER",
        recipient,
        recipientUserId,
        channel: recipient ? "email" : "in-app",
        title: customerTitle,
        message: customerMessage,
        payload: { eventTitle, ticketCode, quantity },
      });

      notifications.push(serializeNotification(customerNotification));
    }

    if (organizerRecipient || organizerUserId) {
      const organizerTitle = "New attendee registration";
      const organizerMessage = `${purchaserName} booked ${quantity} ticket(s) for ${eventTitle}.`;

      if (organizerRecipient) {
        await sendEmailWithRetry({
          to: organizerRecipient,
          subject: `New booking for ${eventTitle}`,
          text: organizerMessage,
          html: `<p>${organizerMessage}</p>`,
        });
      }

      const organizerNotification = await createNotification({
        type: "REGISTRATION",
        recipient: organizerRecipient,
        recipientUserId: organizerUserId,
        channel: organizerRecipient ? "email" : "in-app",
        title: organizerTitle,
        message: organizerMessage,
        payload: { eventTitle, ticketCode, quantity },
      });

      notifications.push(serializeNotification(organizerNotification));
    }

    res.status(202).json({
      success: true,
      message: "Order notifications sent",
      data: {
        notifications,
      },
    });
  } catch (err) {
    try {
      await createNotification({
        type: "ORDER",
        recipient,
        recipientUserId,
        channel: recipient ? "email" : "in-app",
        title: "Order notification failed",
        message: `Unable to send booking confirmation for ${eventTitle}.`,
        payload: { eventTitle, ticketCode, quantity },
        status: "FAILED",
        sentAt: null,
        error: err.message,
      });
    } catch {
      // Ignore secondary logging failure so the primary error still returns.
    }

    res.status(500).json({
      success: false,
      message: "Failed to send order notification",
      error: err.message,
    });
  }
});

// Event reminder trigger
app.post("/api/v1/notifications/reminder", async (req, res) => {
  const {
    recipient,
    recipientUserId,
    channel = "email",
    subject,
    title,
    message,
    eventTitle,
    eventDate,
    daysLeft,
  } = req.body || {};

  if ((!recipient && !recipientUserId) || !eventTitle) {
    return res.status(400).json({
      success: false,
      message: "recipient or recipientUserId, and eventTitle are required",
    });
  }

  const notificationTitle = title || subject || `Reminder: ${eventTitle}`;
  const notificationMessage =
    message ||
    (Number.isFinite(Number(daysLeft))
      ? `Reminder: ${eventTitle} starts in ${Number(daysLeft)} day(s).`
      : eventDate
        ? `Reminder: ${eventTitle} is scheduled for ${eventDate}.`
        : `Reminder: ${eventTitle} starts soon.`);

  const resolvedChannel = recipient ? channel : "in-app";

  try {
    let emailResult = null;

    if (resolvedChannel === "email" && recipient) {
      emailResult = await sendEmailWithRetry({
        to: recipient,
        subject: notificationTitle,
        text: notificationMessage,
        html: `<p>${notificationMessage}</p>`,
      });
    }

    const notification = await createNotification({
      type: "REMINDER",
      recipient,
      recipientUserId,
      channel: resolvedChannel,
      title: notificationTitle,
      message: notificationMessage,
      payload: {
        eventTitle,
        eventDate,
        daysLeft,
      },
      status: "SENT",
      sentAt: new Date(),
    });

    res.status(202).json({
      success: true,
      message: "Reminder sent",
      data: {
        notification: serializeNotification(notification),
        emailResult,
      },
    });
  } catch (err) {
    try {
      await createNotification({
        type: "REMINDER",
        recipient,
        recipientUserId,
        channel: resolvedChannel,
        title: notificationTitle,
        message: notificationMessage,
        payload: {
          eventTitle,
          eventDate,
          daysLeft,
        },
        status: "FAILED",
        sentAt: null,
        error: err.message,
      });
    } catch {
      // Ignore secondary logging failure so the primary error still returns.
    }

    res.status(500).json({
      success: false,
      message: "Failed to send reminder",
      error: err.message,
    });
  }
});

app.get("/api/v1/notifications/my", async (req, res) => {
  const filter = buildIdentityFilter(req.query || {});

  if (!filter) {
    return res.status(400).json({
      success: false,
      message: "recipientUserId or recipient query parameter is required",
    });
  }

  try {
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        notifications: notifications.map(serializeNotification),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: err.message,
    });
  }
});

app.patch("/api/v1/notifications/:id/read", async (req, res) => {
  const filter = buildIdentityFilter(req.body || req.query || {});

  if (!filter) {
    return res.status(400).json({
      success: false,
      message: "recipientUserId or recipient is required",
    });
  }

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, ...filter },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification updated",
      data: {
        notification: serializeNotification(notification),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update notification",
      error: err.message,
    });
  }
});

app.patch("/api/v1/notifications/read-all", async (req, res) => {
  const filter = buildIdentityFilter(req.body || req.query || {});

  if (!filter) {
    return res.status(400).json({
      success: false,
      message: "recipientUserId or recipient is required",
    });
  }

  try {
    const result = await Notification.updateMany(filter, {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Notifications updated",
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update notifications",
      error: err.message,
    });
  }
});

// List notification logs
app.get("/api/v1/notifications/logs", async (req, res) => {
  try {
    const logs = await Notification.find().sort({ createdAt: -1 }).limit(100);
    res.json({
      success: true,
      data: {
        notifications: logs.map(serializeNotification),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
      error: err.message,
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, _req, res, _next) => {
  const statusCode = err.status || 500;
  const message = err.message || "Internal server error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
});

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Notification service listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB", err);
    process.exit(1);
  });
