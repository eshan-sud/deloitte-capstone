import {
  buildAuthConfig,
  extractEnvelope,
  getErrorMessage,
  springClient,
} from "./apiClient";

function toId(value) {
  return value === null || typeof value === "undefined" ? "" : String(value);
}

function toNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizeDateTime(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    return new Date(
      Date.UTC(year, month - 1, day, hour, minute, second),
    ).toISOString();
  }

  return String(value);
}

function normalizeUser(user = {}) {
  return {
    id: toId(user.id),
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    role: user.role || "CUSTOMER",
    isActive: user.isActive ?? user.is_active ?? true,
    createdAt: normalizeDateTime(user.createdAt),
    updatedAt: normalizeDateTime(user.updatedAt),
  };
}

function normalizeVenue(venue = {}) {
  return {
    id: toId(venue.id),
    name: venue.name || "",
    address: venue.address || "",
    capacity: toNumber(venue.capacity),
    pricePerHour: toNumber(venue.pricePerHour),
  };
}

function buildVenueMap(venues = []) {
  return venues.reduce((accumulator, venue) => {
    accumulator[venue.id] = venue;
    return accumulator;
  }, {});
}

function normalizeEvent(event = {}, venueMap = {}) {
  const venueId = toId(event.venueId || event.venue?.id);
  const venue = venueMap[venueId] ||
    (event.venue ? normalizeVenue(event.venue) : null) || {
      id: venueId,
      name: event.venueName || "Venue unavailable",
      address: "",
      capacity: 0,
      pricePerHour: 0,
    };

  return {
    id: toId(event.id),
    title: event.title || "",
    category: event.category || "General",
    description: event.description || "",
    venueId,
    venue,
    organizerId: toId(event.organizerId),
    organizerName: event.organizerName || "",
    startAt: normalizeDateTime(event.startAt),
    endAt: normalizeDateTime(event.endAt),
    capacity: toNumber(event.capacity),
    seatsBooked: toNumber(event.seatsBooked),
    seatsLeft: toNumber(event.seatsLeft),
    price: toNumber(event.price),
    status: event.status || "DRAFT",
    createdAt: normalizeDateTime(event.createdAt),
    updatedAt: normalizeDateTime(event.updatedAt),
  };
}

function normalizeOrder(order = {}) {
  const eventId = toId(order.eventId || order.event?.id);

  return {
    id: toId(order.id),
    userId: toId(order.userId),
    eventId,
    quantity: toNumber(order.quantity),
    totalAmount: toNumber(order.totalAmount),
    status: order.status || "PENDING",
    ticketCode: order.ticketCode || "",
    createdAt: normalizeDateTime(order.createdAt),
    updatedAt: normalizeDateTime(order.updatedAt),
    event: eventId
      ? {
          id: eventId,
          title: order.eventTitle || order.event?.title || "Event removed",
        }
      : null,
  };
}

function toEventRequest(payload) {
  return {
    title: payload.title,
    category: payload.category,
    venueId: payload.venueId,
    description: payload.description,
    startAt: payload.startAt,
    endAt: payload.endAt,
    capacity: payload.capacity,
    price: payload.price,
    status: payload.status,
  };
}

async function fetchVenueMap() {
  const response = await springClient.get("/venues");
  const venues = (extractEnvelope(response) || []).map(normalizeVenue);
  return buildVenueMap(venues);
}

export const springApi = {
  async login(credentials) {
    try {
      const response = await springClient.post("/auth/login", credentials);
      const data = extractEnvelope(response) || {};

      return {
        token: data.token || "",
        user: normalizeUser(data.user),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async register(payload) {
    try {
      const response = await springClient.post("/auth/register", payload);
      const data = extractEnvelope(response) || {};

      return {
        token: data.token || "",
        user: normalizeUser(data.user),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getCurrentUser(token) {
    try {
      const response = await springClient.get(
        "/auth/me",
        buildAuthConfig(token),
      );
      return {
        user: normalizeUser(extractEnvelope(response)),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async updateProfile(token, updates) {
    try {
      const response = await springClient.put(
        "/users/me",
        updates,
        buildAuthConfig(token),
      );

      return {
        user: normalizeUser(extractEnvelope(response)),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async listUsers(token) {
    try {
      const response = await springClient.get(
        "/auth/users",
        buildAuthConfig(token),
      );

      return {
        users: (extractEnvelope(response) || []).map(normalizeUser),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async updateUserStatus(token, userId, { isActive }) {
    try {
      const response = await springClient.patch(
        `/auth/users/${userId}/status`,
        { isActive },
        buildAuthConfig(token),
      );

      return {
        user: normalizeUser(extractEnvelope(response)),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async updateUserRole(token, userId, role) {
    try {
      const response = await springClient.patch(
        `/auth/users/${userId}/role`,
        { role },
        buildAuthConfig(token),
      );

      return {
        user: normalizeUser(extractEnvelope(response)),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getVenues() {
    try {
      const response = await springClient.get("/venues");

      return {
        venues: (extractEnvelope(response) || []).map(normalizeVenue),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getEvents(filters = {}, token = "") {
    try {
      const [eventsResponse, venueMap] = await Promise.all([
        springClient.get("/events", {
          ...buildAuthConfig(token),
          params: {
            query: filters.query || undefined,
            category:
              filters.category && filters.category !== "ALL"
                ? filters.category
                : undefined,
            status:
              filters.status && filters.status !== "ALL"
                ? filters.status
                : undefined,
            includeDrafts: Boolean(filters.includeDrafts),
          },
        }),
        fetchVenueMap(),
      ]);

      return {
        events: (extractEnvelope(eventsResponse) || []).map((event) =>
          normalizeEvent(event, venueMap),
        ),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getEventById(eventId) {
    try {
      const [eventResponse, venueMap] = await Promise.all([
        springClient.get(`/events/${eventId}`),
        fetchVenueMap(),
      ]);

      return {
        event: normalizeEvent(extractEnvelope(eventResponse), venueMap),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async createEvent(token, payload) {
    try {
      const [response, venueMap] = await Promise.all([
        springClient.post(
          "/events",
          toEventRequest(payload),
          buildAuthConfig(token),
        ),
        fetchVenueMap(),
      ]);

      return {
        event: normalizeEvent(extractEnvelope(response), venueMap),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async updateEvent(token, eventId, payload) {
    try {
      const [response, venueMap] = await Promise.all([
        springClient.put(
          `/events/${eventId}`,
          toEventRequest(payload),
          buildAuthConfig(token),
        ),
        fetchVenueMap(),
      ]);

      return {
        event: normalizeEvent(extractEnvelope(response), venueMap),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async deleteEvent(token, eventId) {
    try {
      await springClient.delete(`/events/${eventId}`, buildAuthConfig(token));
      return { success: true };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async placeOrder(token, payload) {
    try {
      const response = await springClient.post(
        "/orders",
        payload,
        buildAuthConfig(token),
      );

      return {
        order: normalizeOrder(extractEnvelope(response)),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getMyOrders(token) {
    try {
      const response = await springClient.get(
        "/orders/my",
        buildAuthConfig(token),
      );

      return {
        orders: (extractEnvelope(response) || []).map(normalizeOrder),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async cancelOrder(token, orderId) {
    try {
      const response = await springClient.patch(
        `/orders/${orderId}/cancel`,
        {},
        buildAuthConfig(token),
      );

      return {
        order: normalizeOrder(extractEnvelope(response)),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
