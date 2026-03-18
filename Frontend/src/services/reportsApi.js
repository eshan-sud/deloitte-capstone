import { extractEnvelope, getErrorMessage, reportsClient } from "./apiClient";

function toNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizeSummary(summary = {}) {
  return {
    totalUsers: toNumber(summary.totalUsers ?? summary.users),
    totalEvents: toNumber(summary.totalEvents ?? summary.events),
    totalOrders: toNumber(summary.totalOrders ?? summary.orders),
    confirmedOrders: toNumber(summary.confirmedOrders),
    grossRevenue: toNumber(summary.grossRevenue),
    totalExpenses: toNumber(summary.totalExpenses),
    netRevenue: toNumber(summary.netRevenue),
  };
}

function normalizeBudgetRow(row = {}) {
  const plannedAmount = toNumber(row.plannedAmount);
  const actualAmount = toNumber(row.actualAmount);

  return {
    budgetId: String(row.budgetId || ""),
    eventId: String(row.eventId || ""),
    eventTitle: row.eventTitle || "Unknown event",
    plannedAmount,
    actualAmount,
    variance: toNumber(row.variance ?? plannedAmount - actualAmount),
  };
}

export const reportsApi = {
  async getAdminReports(filters = {}) {
    try {
      const params = {};

      if (filters.from) {
        params.from = filters.from;
      }

      if (filters.to) {
        params.to = filters.to;
      }

      if (filters.organizerId) {
        params.organizerId = String(filters.organizerId).trim();
      }

      if (filters.status && filters.status !== "ALL") {
        params.status = String(filters.status).trim().toUpperCase();
      }

      const [summaryResponse, categoriesResponse, budgetResponse] =
        await Promise.all([
          reportsClient.get("/reports/summary", { params }),
          reportsClient.get("/reports/orders-by-category", { params }),
          reportsClient.get("/reports/budget-vs-actual", { params }),
        ]);

      const summary = normalizeSummary(extractEnvelope(summaryResponse));
      const categoryRows = extractEnvelope(categoriesResponse) || [];
      const budgetRows = (extractEnvelope(budgetResponse) || []).map(
        normalizeBudgetRow,
      );

      return {
        summary,
        ordersByCategory: categoryRows.reduce((accumulator, row) => {
          const category = row?.category || "Uncategorized";
          accumulator[category] = toNumber(row?.count);
          return accumulator;
        }, {}),
        budgetRows,
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async createBudget(payload) {
    try {
      const response = await reportsClient.post("/reports/budget", payload);
      return extractEnvelope(response);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
