const request = require("supertest");

const mockNotificationCreate = jest.fn();
const mockSendEmail = jest.fn();
const mockGetOrganizerEmailByEventId = jest.fn();
const mockGetUserEmailById = jest.fn();

jest.mock("../src/db", () => ({
  connectDb: jest.fn().mockResolvedValue(undefined),
  Notification: {
    create: (...args) => mockNotificationCreate(...args),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateMany: jest.fn(),
  },
}));

jest.mock("../src/email", () => ({
  sendEmail: (...args) => mockSendEmail(...args),
}));

jest.mock("../src/db-mysql", () => ({
  getUserEmailById: (...args) => mockGetUserEmailById(...args),
  getOrganizerEmailByEventId: (...args) =>
    mockGetOrganizerEmailByEventId(...args),
}));

const { app } = require("../src/server");

function buildNotificationDoc(overrides = {}) {
  return {
    _id: "67f01d7deeb0000000000001",
    type: "GENERIC",
    title: "Title",
    message: "Message",
    recipient: "customer@example.com",
    recipientUserId: null,
    channel: "email",
    status: "SENT",
    isRead: false,
    createdAt: new Date().toISOString(),
    readAt: null,
    sentAt: new Date().toISOString(),
    payload: {},
    ...overrides,
  };
}

describe("notification service API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue({ accepted: ["customer@example.com"] });
    mockGetOrganizerEmailByEventId.mockResolvedValue("organizer@example.com");
    mockGetUserEmailById.mockResolvedValue("sender@example.com");
  });

  test("GET /api/health returns healthy payload", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.service).toBe("notification-service");
  });

  test("POST /api/v1/notifications/send validates required fields", async () => {
    const response = await request(app)
      .post("/api/v1/notifications/send")
      .send({ recipient: "" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("POST /api/v1/notifications/send creates and sends email", async () => {
    mockNotificationCreate.mockResolvedValue(
      buildNotificationDoc({
        type: "ORDER",
        title: "Order created",
        message: "Order confirmed",
      }),
    );

    const response = await request(app)
      .post("/api/v1/notifications/send")
      .send({
        type: "ORDER",
        recipient: "customer@example.com",
        channel: "email",
        title: "Order created",
        message: "Order confirmed",
      });

    expect(response.status).toBe(202);
    expect(response.body.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
  });

  test("POST /api/v1/notifications/event-order-created validates inputs", async () => {
    const response = await request(app)
      .post("/api/v1/notifications/event-order-created")
      .send({ recipient: "customer@example.com" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("POST /api/v1/notifications/reminder supports in-app boundary case", async () => {
    mockNotificationCreate.mockResolvedValue(
      buildNotificationDoc({
        type: "REMINDER",
        recipient: null,
        recipientUserId: "42",
        channel: "in-app",
      }),
    );

    const response = await request(app)
      .post("/api/v1/notifications/reminder")
      .send({ recipientUserId: "42", eventTitle: "Demo Summit" });

    expect(response.status).toBe(202);
    expect(response.body.success).toBe(true);
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
  });
});
