import { reportsApi } from "./reportsApi";
import { springApi } from "./springApi";

function getErrorReasonMessage(reason, fallbackMessage) {
  if (reason instanceof Error && reason.message) {
    return reason.message;
  }

  if (typeof reason === "string" && reason.trim()) {
    return reason;
  }

  return fallbackMessage;
}

function sortUpcomingEvents(events = []) {
  return [...events].sort(
    (left, right) => new Date(left.startAt) - new Date(right.startAt),
  );
}

function isFutureEvent(event) {
  return Boolean(event?.startAt) && new Date(event.startAt) > new Date();
}

export const dashboardApi = {
  async getDashboardSummary(token, user) {
    if (!token || !user) {
      throw new Error("Authentication required.");
    }

    if (user.role === "ADMIN") {
      const [reportResult, eventsResult] = await Promise.allSettled([
        reportsApi.getAdminReports(),
        springApi.getEvents({ status: "ALL", includeDrafts: true }, token),
      ]);

      if (
        reportResult.status === "rejected" &&
        eventsResult.status === "rejected"
      ) {
        throw new Error("Failed to load admin dashboard data.");
      }

      const report =
        reportResult.status === "fulfilled"
          ? reportResult.value
          : {
              summary: {
                totalUsers: 0,
                totalEvents: 0,
                confirmedOrders: 0,
                grossRevenue: 0,
                totalExpenses: 0,
                netRevenue: 0,
              },
            };

      const events =
        eventsResult.status === "fulfilled"
          ? eventsResult.value?.events || []
          : [];

      const warningMessages = [];
      if (reportResult.status === "rejected") {
        warningMessages.push(
          `Reporting service: ${getErrorReasonMessage(
            reportResult.reason,
            "unavailable",
          )}`,
        );
      }

      if (eventsResult.status === "rejected") {
        warningMessages.push(
          `Events service: ${getErrorReasonMessage(
            eventsResult.reason,
            "unavailable",
          )}`,
        );
      }

      return {
        role: user.role,
        kpis: {
          totalUsers: report.summary.totalUsers,
          totalEvents: report.summary.totalEvents,
          confirmedOrders: report.summary.confirmedOrders,
          grossRevenue: report.summary.grossRevenue,
          totalExpenses: report.summary.totalExpenses,
          netRevenue: report.summary.netRevenue,
        },
        upcomingEvents: sortUpcomingEvents(events.filter(isFutureEvent)).slice(
          0,
          5,
        ),
        warningMessage:
          warningMessages.length > 0 ? warningMessages.join(" | ") : "",
      };
    }

    if (user.role === "ORGANIZER") {
      const eventsResponse = await springApi.getEvents(
        { status: "ALL", includeDrafts: true },
        token,
      );
      const organizerEvents = eventsResponse.events.filter(
        (event) => event.organizerId === user.id,
      );

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
          activeRegistrations: organizerEvents.reduce(
            (sum, event) => sum + Number(event.seatsBooked || 0),
            0,
          ),
        },
        upcomingEvents: sortUpcomingEvents(
          organizerEvents.filter(isFutureEvent),
        ).slice(0, 5),
      };
    }

    const ordersResponse = await springApi.getMyOrders(token);
    const confirmedOrders = ordersResponse.orders.filter(
      (order) => order.status === "CONFIRMED",
    );
    const uniqueEventIds = [
      ...new Set(confirmedOrders.map((order) => order.eventId)),
    ];
    const eventResults = await Promise.allSettled(
      uniqueEventIds.map((eventId) => springApi.getEventById(eventId)),
    );
    const events = eventResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value.event)
      .filter(isFutureEvent);

    return {
      role: user.role,
      kpis: {
        bookings: ordersResponse.orders.length,
        activeBookings: confirmedOrders.length,
        totalSpent: confirmedOrders.reduce(
          (sum, order) => sum + Number(order.totalAmount || 0),
          0,
        ),
      },
      upcomingEvents: sortUpcomingEvents(events),
    };
  },
};
