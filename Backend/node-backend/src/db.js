const mongoose = require("mongoose");

const connectDb = async () => {
  const uri = process.env.DB_URI;
  if (!uri) throw new Error("DB_URI not set in environment");
  await mongoose.connect(uri);
  console.log("MongoDB connected");
};

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  recipient: { type: String, default: null, lowercase: true, trim: true },
  recipientUserId: { type: String, default: null, index: true },
  channel: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, default: "QUEUED" },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  error: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
  sentAt: { type: Date, default: null },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = { connectDb, Notification };
