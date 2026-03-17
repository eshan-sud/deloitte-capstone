/*
  TEMPORARY MOCK API IMPLEMENTATION
  ---------------------------------
  This file intentionally simulates backend APIs with localStorage-backed data.
  Replace these methods with real HTTP calls (Spring, Node, ASP.NET) during backend integration.
*/

const STORAGE_KEY = "eventnest_mock_db_v1";
const DEFAULT_LATENCY_MS = 350;

function wait(ms = DEFAULT_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createToken(userId) {
  const payload = JSON.stringify({ userId, ts: Date.now() });
  return `mock.${btoa(payload)}`;
}

function getUserIdFromToken(token) {
  if (!token || !token.startsWith("mock.")) {
    return null;
  }

  try {
    const payload = JSON.parse(atob(token.replace("mock.", "")));
    return payload.userId || null;
  } catch {
    return null;
  }
}

function toPublicUser(user) {
  const { password, ...publicUser } = user;
  return publicUser;
}

function getSeedData() {
  const baseTime = nowIso();

  return {
    users: [
      {
        id: "u-admin",
        firstName: "Ava",
        lastName: "Admin",
        email: "admin@eventnest.io",
        password: "Admin@123",
        role: "ADMIN",
        isActive: true,
        createdAt: baseTime,
        updatedAt: baseTime,
      },
      {
        id: "u-organizer",
        firstName: "Owen",
        lastName: "Organizer",
        email: "organizer@eventnest.io",
        password: "Organizer@123",
        role: "ORGANIZER",
        isActive: true,
        createdAt: baseTime,
        updatedAt: baseTime,
      },
      {
        id: "u-customer",
        firstName: "Casey",
        lastName: "Customer",
        email: "customer@eventnest.io",
        password: "Customer@123",
        role: "CUSTOMER",
        isActive: true,
        createdAt: baseTime,
        updatedAt: baseTime,
      },
    ],
    venues: [
      {
        id: "v-innovation",
        name: "Innovation Hall",
        address: "City Center Campus",
        capacity: 220,
        pricePerHour: 2200,
      },
      {
        id: "v-studio",
        name: "Studio Commons",
        address: "Design District",
        capacity: 140,
        pricePerHour: 1600,
      },
      {
        id: "v-auditorium",
        name: "Main Auditorium",
        address: "Riverside Block",
        capacity: 420,
        pricePerHour: 3500,
      },
    ],
    events: [
      {
        id: "e-open-source",
        title: "Open Source Summit",
        category: "Tech",
        venueId: "v-innovation",
        organizerId: "u-organizer",
        description:
          "Community conference with talks on OSS tooling, governance, and contributor onboarding.",
        startAt: "2026-04-20T10:00:00.000Z",
        endAt: "2026-04-20T16:00:00.000Z",
        capacity: 220,
        seatsBooked: 146,
        price: 499,
        status: "PUBLISHED",
        createdAt: baseTime,
        updatedAt: baseTime,
      },
      {
        id: "e-design-sprint",
        title: "Design Sprint Showcase",
        category: "Design",
        venueId: "v-studio",
        organizerId: "u-organizer",
        description:
          "Product design sprint review with mentor feedback, prototype demos, and networking.",
        startAt: "2026-04-25T12:30:00.000Z",
        endAt: "2026-04-25T15:00:00.000Z",
        capacity: 140,
        seatsBooked: 83,
        price: 299,
        status: "PUBLISHED",
        createdAt: baseTime,
        updatedAt: baseTime,
      },
      {
        id: "e-career-fair",
        title: "Career Growth Fair",
        category: "Community",
        venueId: "v-auditorium",
        organizerId: "u-organizer",
        description:
          "Career guidance, networking pods, and panel sessions with recruiters and alumni.",
        startAt: "2026-05-04T09:00:00.000Z",
        endAt: "2026-05-04T17:00:00.000Z",
        capacity: 420,
        seatsBooked: 212,
        price: 199,
        status: "PUBLISHED",
        createdAt: baseTime,
        updatedAt: baseTime,
      },
      {
        id: "e-ai-hacknight",
        title: "AI Hack Night",
        category: "Tech",
        venueId: "v-innovation",
        organizerId: "u-organizer",
        description:
          "Night-long build sprint with mentor checkpoints and final team pitches.",
        startAt: "2026-05-11T17:30:00.000Z",
        endAt: "2026-05-11T23:00:00.000Z",
        capacity: 160,
        seatsBooked: 0,
        price: 399,
        status: "DRAFT",
        createdAt: baseTime,
        updatedAt: baseTime,
      },
    ],
    orders: [
      {
        id: "o-10001",
        userId: "u-customer",
        eventId: "e-open-source",
        quantity: 2,
        totalAmount: 998,
        status: "CONFIRMED",
        ticketCode: "TKT-OS-2026-8211",
        createdAt: baseTime,
        updatedAt: baseTime,
      },
    ],
    notifications: [
      {
        id: "n-10001",
        userId: "u-customer",
        title: "Booking confirmed",
        message:
          "Your Open Source Summit booking is confirmed. Ticket code: TKT-OS-2026-8211",
        type: "ORDER",
        isRead: false,
        createdAt: baseTime,
      },
    ],
    budgets: [
      {
        id: "b-10001",
        eventId: "e-open-source",
        plannedAmount: 150000,
        note: "Venue, speakers, media",
        createdAt: baseTime,
      },
      {
        id: "b-10002",
        eventId: "e-design-sprint",
        plannedAmount: 85000,
        note: "Workshop kits and production",
        createdAt: baseTime,
      },
    ],
    expenses: [
      {
        id: "x-10001",
        eventId: "e-open-source",
        category: "Venue",
        amount: 65000,
        note: "Hall booking",
        createdAt: baseTime,
      },
      {
        id: "x-10002",
        eventId: "e-open-source",
        category: "Marketing",
        amount: 28000,
        note: "Social and print campaign",
        createdAt: baseTime,
      },
      {
        id: "x-10003",
        eventId: "e-design-sprint",
        category: "Operations",
        amount: 24000,
        note: "Production and setup",
        createdAt: baseTime,
      },
    ],
  };
}

function loadDb() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = getSeedData();
    saveDb(seed);
    return seed;
  }

  try {
    return JSON.parse(raw);
  } catch {
    const seed = getSeedData();
    saveDb(seed);
    return seed;
  }
}

function saveDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function requireAuthUser(db, token) {
  const userId = getUserIdFromToken(token);
  if (!userId) {
    throw new Error("Authentication required.");
  }

  const user = db.users.find((item) => item.id === userId);
  if (!user || !user.isActive) {
    throw new Error("Session is invalid or inactive.");
  }

  return user;
}

function requireRole(user, allowedRoles) {
  if (!allowedRoles.includes(user.role)) {
    throw new Error("You are not authorized for this action.");
  }
}

function getVenueById(db, venueId) {
  return db.venues.find((venue) => venue.id === venueId) || null;
}

function getUserById(db, userId) {
  return db.users.find((user) => user.id === userId) || null;
}

function hydrateEvent(db, event) {
  const venue = getVenueById(db, event.venueId);
  const organizer = getUserById(db, event.organizerId);

  return {
    ...event,
    venue,
    organizerName: organizer
      ? `${organizer.firstName} ${organizer.lastName}`
      : "Unknown organizer",
    seatsLeft: Math.max(event.capacity - event.seatsBooked, 0),
  };
}

function hydrateOrder(db, order) {
  const event = db.events.find((item) => item.id === order.eventId);

  return {
    ...order,
    event: event ? hydrateEvent(db, event) : null,
  };
}

async function withMockLatency(work) {
  await wait();
  return work();
}

export const mockApi = {
  // TEMPORARY MOCK API: Auth endpoints simulation
  async login({ email, password }) {
    return withMockLatency(() => {
      const db = loadDb();
      const user = db.users.find(
        (item) => item.email.toLowerCase() === email.toLowerCase(),
      );

      if (!user || user.password !== password) {
        throw new Error("Invalid email or password.");
      }

      if (!user.isActive) {
        throw new Error("Your account is inactive. Contact support.");
      }

      return {
        token: createToken(user.id),
        user: toPublicUser(user),
      };
    });
  },

  async register(payload) {
    return withMockLatency(() => {
      const db = loadDb();
      const existing = db.users.find(
        (item) => item.email.toLowerCase() === payload.email.toLowerCase(),
      );

      if (existing) {
        throw new Error("An account with this email already exists.");
      }

      const timestamp = nowIso();
      const newUser = {
        id: createId("u"),
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        role: "CUSTOMER",
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      db.users.unshift(newUser);
      db.notifications.unshift({
        id: createId("n"),
        userId: newUser.id,
        title: "Welcome to EventNest",
        message:
          "Your account is active. Explore events and book your first experience.",
        type: "SYSTEM",
        isRead: false,
        createdAt: timestamp,
      });
      saveDb(db);

      return {
        token: createToken(newUser.id),
        user: toPublicUser(newUser),
      };
    });
  },

  async getCurrentUser(token) {
    return withMockLatency(() => {
      const db = loadDb();
      const user = requireAuthUser(db, token);
      return { user: toPublicUser(user) };
    });
  },

  async updateProfile(token, updates) {
    return withMockLatency(() => {
      const db = loadDb();
      const user = requireAuthUser(db, token);

      if (updates.email) {
        const duplicate = db.users.find(
          (item) =>
            item.email.toLowerCase() === updates.email.toLowerCase() &&
            item.id !== user.id,
        );

        if (duplicate) {
          throw new Error("Email already in use by another account.");
        }
      }

      user.firstName = (updates.firstName || user.firstName).trim();
      user.lastName = (updates.lastName || user.lastName).trim();
      user.email = (updates.email || user.email).trim().toLowerCase();
      user.updatedAt = nowIso();

      saveDb(db);
      return { user: toPublicUser(user) };
    });
  },

  async listUsers(token) {
    return withMockLatency(() => {
      const db = loadDb();
      const requester = requireAuthUser(db, token);
      requireRole(requester, ["ADMIN"]);

      return {
        users: db.users.map((user) => toPublicUser(user)),
      };
    });
  },

  async updateUserStatus(token, userId, updates = {}) {
    return withMockLatency(() => {
      const db = loadDb();
      const requester = requireAuthUser(db, token);
      requireRole(requester, ["ADMIN"]);

      const user = db.users.find((item) => item.id === userId);
      if (!user) {
        throw new Error("User not found.");
      }

      const payload =
        typeof updates === "object" && updates !== null
          ? updates
          : { isActive: updates };

      if (typeof payload.isActive !== "undefined") {
        if (requester.id === user.id && !payload.isActive) {
          throw new Error("You cannot deactivate your own account.");
        }

        user.isActive = Boolean(payload.isActive);
      }

      if (typeof payload.role !== "undefined") {
        const allowedRoles = ["ADMIN", "ORGANIZER", "CUSTOMER"];

        if (!allowedRoles.includes(payload.role)) {
          throw new Error("Invalid role value.");
        }

        user.role = payload.role;
      }

      user.updatedAt = nowIso();
      saveDb(db);

      return { user: toPublicUser(user) };
    });
  },

  // TEMPORARY MOCK API: Event endpoints simulation
  async getVenues() {
    return withMockLatency(() => {
      const db = loadDb();
      return { venues: deepCopy(db.venues) };
    });
  },

  async getEvents(filters = {}) {
    return withMockLatency(() => {
      const db = loadDb();
      let events = db.events.map((event) => hydrateEvent(db, event));

      if (filters.status && filters.status !== "ALL") {
        events = events.filter((event) => event.status === filters.status);
      }

      if (filters.category && filters.category !== "ALL") {
        events = events.filter((event) => event.category === filters.category);
      }

      if (filters.query) {
        const query = filters.query.trim().toLowerCase();
        events = events.filter((event) => {
          const titleMatch = event.title.toLowerCase().includes(query);
          const descriptionMatch = event.description
            .toLowerCase()
            .includes(query);
          const venueMatch = event.venue?.name.toLowerCase().includes(query);
          return titleMatch || descriptionMatch || venueMatch;
        });
      }

      if (!filters.includeDrafts) {
        events = events.filter((event) => event.status === "PUBLISHED");
      }

      events.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

      return { events: deepCopy(events) };
    });
  },

  async getEventById(eventId) {
    return withMockLatency(() => {
      const db = loadDb();
      const event = db.events.find((item) => item.id === eventId);

      if (!event) {
        throw new Error("Event not found.");
      }

      return { event: deepCopy(hydrateEvent(db, event)) };
    });
  },

  async createEvent(token, payload) {
    return withMockLatency(() => {
      const db = loadDb();
      const user = requireAuthUser(db, token);
      requireRole(user, ["ADMIN", "ORGANIZER"]);

      const venue = getVenueById(db, payload.venueId);
      if (!venue) {
        throw new Error("Selected venue does not exist.");
      }

      const timestamp = nowIso();
      const event = {
        id: createId("e"),
        organizerId: user.id,
        title: payload.title.trim(),
        category: payload.category,
        venueId: payload.venueId,
        description: payload.description.trim(),
        startAt: payload.startAt,
        endAt: payload.endAt,
        capacity: Number(payload.capacity),
        seatsBooked: 0,
        price: Number(payload.price),
        status: payload.status || "DRAFT",
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      db.events.unshift(event);

      if (payload.budgetAmount && Number(payload.budgetAmount) > 0) {
        db.budgets.unshift({
          id: createId("b"),
          eventId: event.id,
          plannedAmount: Number(payload.budgetAmount),
          note: payload.budgetNote?.trim() || "Planned event budget",
          createdAt: timestamp,
        });
      }

      saveDb(db);
      return { event: deepCopy(hydrateEvent(db, event)) };
    });
  },

  async updateEvent(token, eventId, payload) {
    return withMockLatency(() => {
      const db = loadDb();
      const user = requireAuthUser(db, token);
      requireRole(user, ["ADMIN", "ORGANIZER"]);

      const event = db.events.find((item) => item.id === eventId);
      if (!event) {
        throw new Error("Event not found.");
      }

      if (user.role !== "ADMIN" && event.organizerId !== user.id) {
        throw new Error("You can only edit events you created.");
      }

      const nextCapacity = Number(payload.capacity);
      if (nextCapacity < event.seatsBooked) {
        throw new Error("Capacity cannot be lower than booked seats.");
      }

      event.title = payload.title.trim();
      event.category = payload.category;
      event.venueId = payload.venueId;
      event.description = payload.description.trim();
      event.startAt = payload.startAt;
      event.endAt = payload.endAt;
      event.capacity = nextCapacity;
      event.price = Number(payload.price);
      event.status = payload.status;
      event.updatedAt = nowIso();

      saveDb(db);
      return { event: deepCopy(hydrateEvent(db, event)) };
    });
  },

  async deleteEvent(token, eventId) {
    return withMockLatency(() => {
      const db = loadDb();
      const user = requireAuthUser(db, token);
      requireRole(user, ["ADMIN", "ORGANIZER"]);

      const event = db.events.find((item) => item.id === eventId);
      if (!event) {
        throw new Error("Event not found.");
      }

      if (user.role !== "ADMIN" && event.organizerId !== user.id) {
        throw new Error("You can only delete events you created.");
      }

      db.events = db.events.filter((item) => item.id !== eventId);
      db.orders = db.orders.filter((order) => order.eventId !== eventId);
      saveDb(db);
      return { success: true };
    });
  },

  // TEMPORARY MOCK API: Order and attendee endpoints simulation
  async placeOrder(token, payload) {
    return withMockLatency(() => {
      const db = loadDb();
      const user = requireAuthUser(db, token);

      const event = db.events.find((item) => item.id === payload.eventId);
      if (!event) {
        throw new Error("Event not found.");
      }

      if (event.status !== "PUBLISHED") {
        throw new Error("This event is not open for registrations.");
      }

      const quantity = Number(payload.quantity);
      if (!quantity || quantity < 1) {
        throw new Error("Ticket quantity must be at least 1.");
      }

      const seatsLeft = Math.max(event.capacity - event.seatsBooked, 0);
      if (quantity > seatsLeft) {
        throw new Error(
          "Not enough seats available for the selected quantity.",
        );
      }

      event.seatsBooked += quantity;
      event.updatedAt = nowIso();

      const order = {
        id: createId("o"),
        userId: user.id,
        eventId: event.id,
        quantity,
        totalAmount: Number(event.price) * quantity,
        status: "CONFIRMED",
        ticketCode: `TKT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      db.orders.unshift(order);

      db.notifications.unshift(
        {
          id: createId("n"),
          userId: user.id,
          title: "Order confirmed",
          message: `Order ${order.id} confirmed for ${event.title}. Ticket: ${order.ticketCode}`,
          type: "ORDER",
          isRead: false,
          createdAt: nowIso(),
        },
        {
          id: createId("n"),
          userId: event.organizerId,
          title: "New attendee registration",
          message: `${user.firstName} ${user.lastName} booked ${quantity} ticket(s) for ${event.title}.`,
          type: "REGISTRATION",
          isRead: false,
          createdAt: nowIso(),
        },
      );

      saveDb(db);
      return { order: deepCopy(hydrateOrder(db, order)) };
    });
  },

  async getMyOrders(token) {
    return withMockLatency(() => {
      const db = loadDb();
      const user = requireAuthUser(db, token);

      const orders = db.orders
        .filter((order) => order.userId === user.id)
        .map((order) => hydrateOrder(db, order))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return { orders: deepCopy(orders) };
    });
  },

  async cancelOrder(token, orderId) {
    return withMockLatency(() => {
      const db = loadDb();
      const user = requireAuthUser(db, token);

      const order = db.orders.find((item) => item.id === orderId);
      if (!order) {
        throw new Error("Order not found.");
      }

      const canCancel = user.role === "ADMIN" || order.userId === user.id;
      if (!canCancel) {
        throw new Error("You are not allowed to cancel this order.");
      }

      if (order.status === "CANCELLED") {
        throw new Error("Order is already cancelled.");
      }

      const event = db.events.find((item) => item.id === order.eventId);
      if (event) {
        event.seatsBooked = Math.max(event.seatsBooked - order.quantity, 0);
        event.updatedAt = nowIso();
      }

      order.status = "CANCELLED";
      order.updatedAt = nowIso();

      db.notifications.unshift({
        id: createId("n"),
        userId: order.userId,
        title: "Order cancelled",
        message: `Order ${order.id} was cancelled successfully.`,
        type: "ORDER",
        isRead: false,
        createdAt: nowIso(),
      });

      saveDb(db);
      return { order: deepCopy(hydrateOrder(db, order)) };
    });
  },

  // TEMPORARY MOCK API: Notification endpoints simulation
  async getMyNotifications(token) {
    return withMockLatency(() => {
      const db = loadDb();
      const user = requireAuthUser(db, token);

      const notifications = db.notifications
        .filter((item) => item.userId === user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return { notifications: deepCopy(notifications) };
    });
  },

  async markNotificationRead(token, notificationId) {
    return withMockLatency(() => {
      const db = loadDb();
      const user = requireAuthUser(db, token);

      const notification = db.notifications.find(
        (item) => item.id === notificationId && item.userId === user.id,
      );

      if (!notification) {
        throw new Error("Notification not found.");
      }

      notification.isRead = true;
      saveDb(db);

      return { notification: deepCopy(notification) };
    });
  },

  async markAllNotificationsRead(token) {
    return withMockLatency(() => {
      const db = loadDb();
      const user = requireAuthUser(db, token);

      db.notifications.forEach((item) => {
        if (item.userId === user.id) {
          item.isRead = true;
        }
      });

      saveDb(db);
      return { success: true };
    });
  },

  // TEMPORARY MOCK API: Dashboard and reporting endpoints simulation
  async getDashboardSummary(token) {
    return withMockLatency(() => {
      const db = loadDb();
      const user = requireAuthUser(db, token);

      if (user.role === "ADMIN") {
        const publishedEvents = db.events.filter(
          (event) => event.status === "PUBLISHED",
        );
        const confirmedOrders = db.orders.filter(
          (order) => order.status === "CONFIRMED",
        );

        return {
          role: user.role,
          kpis: {
            totalUsers: db.users.length,
            totalEvents: db.events.length,
            publishedEvents: publishedEvents.length,
            totalOrders: db.orders.length,
            confirmedOrders: confirmedOrders.length,
            grossRevenue: confirmedOrders.reduce(
              (sum, order) => sum + order.totalAmount,
              0,
            ),
          },
          upcomingEvents: deepCopy(
            db.events
              .filter((event) => new Date(event.startAt) > new Date())
              .map((event) => hydrateEvent(db, event))
              .slice(0, 5),
          ),
        };
      }

      if (user.role === "ORGANIZER") {
        const organizerEvents = db.events.filter(
          (event) => event.organizerId === user.id,
        );
        const organizerEventIds = new Set(
          organizerEvents.map((item) => item.id),
        );

        const attendeeCount = db.orders
          .filter(
            (order) =>
              organizerEventIds.has(order.eventId) &&
              order.status === "CONFIRMED",
          )
          .reduce((sum, order) => sum + order.quantity, 0);

        return {
          role: user.role,
          kpis: {
            myEvents: organizerEvents.length,
            publishedEvents: organizerEvents.filter(
              (event) => event.status === "PUBLISHED",
            ).length,
            draftEvents: organizerEvents.filter(
              (event) => event.status === "DRAFT",
            ).length,
            activeRegistrations: attendeeCount,
          },
          upcomingEvents: deepCopy(
            organizerEvents
              .filter((event) => new Date(event.startAt) > new Date())
              .map((event) => hydrateEvent(db, event))
              .slice(0, 5),
          ),
        };
      }

      const myOrders = db.orders.filter((order) => order.userId === user.id);
      const activeOrders = myOrders.filter(
        (order) => order.status === "CONFIRMED",
      );

      return {
        role: user.role,
        kpis: {
          bookings: myOrders.length,
          activeBookings: activeOrders.length,
          totalSpent: activeOrders.reduce(
            (sum, order) => sum + order.totalAmount,
            0,
          ),
        },
        upcomingEvents: deepCopy(
          activeOrders
            .map((order) =>
              db.events.find((event) => event.id === order.eventId),
            )
            .filter(Boolean)
            .filter((event) => new Date(event.startAt) > new Date())
            .map((event) => hydrateEvent(db, event)),
        ),
      };
    });
  },

  async getAdminReports(token) {
    return withMockLatency(() => {
      const db = loadDb();
      const user = requireAuthUser(db, token);
      requireRole(user, ["ADMIN"]);

      const confirmedOrders = db.orders.filter(
        (order) => order.status === "CONFIRMED",
      );
      const grossRevenue = confirmedOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0,
      );
      const totalExpenses = db.expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0,
      );
      const netRevenue = grossRevenue - totalExpenses;

      const ordersByCategory = db.events.reduce((acc, event) => {
        const category = event.category;
        if (!acc[category]) {
          acc[category] = 0;
        }

        const eventOrders = confirmedOrders.filter(
          (order) => order.eventId === event.id,
        );
        acc[category] += eventOrders.length;
        return acc;
      }, {});

      const budgetRows = db.budgets.map((budget) => {
        const event = db.events.find((item) => item.id === budget.eventId);
        const spent = db.expenses
          .filter((expense) => expense.eventId === budget.eventId)
          .reduce((sum, expense) => sum + expense.amount, 0);

        return {
          budgetId: budget.id,
          eventId: budget.eventId,
          eventTitle: event ? event.title : "Unknown event",
          plannedAmount: budget.plannedAmount,
          actualAmount: spent,
          variance: budget.plannedAmount - spent,
        };
      });

      return {
        summary: {
          totalUsers: db.users.length,
          totalEvents: db.events.length,
          totalOrders: db.orders.length,
          confirmedOrders: confirmedOrders.length,
          grossRevenue,
          totalExpenses,
          netRevenue,
        },
        ordersByCategory,
        budgetRows,
      };
    });
  },
};
