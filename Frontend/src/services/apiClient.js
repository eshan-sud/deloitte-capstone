import axios from "axios";

function formatFieldLabel(fieldName) {
  if (!fieldName || typeof fieldName !== "string") {
    return "field";
  }

  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase())
    .trim();
}

function resolveBaseUrl(envName, fallback) {
  const value = import.meta.env[envName];

  if (typeof value === "string" && value.trim()) {
    return value.trim().replace(/\/+$/, "");
  }

  return fallback;
}

function resolveOptionalEnvValue(envName) {
  const value = import.meta.env[envName];

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "";
}

const reportsAdminKey = resolveOptionalEnvValue("VITE_REPORTS_ADMIN_KEY");

export const springClient = axios.create({
  baseURL: resolveBaseUrl("VITE_SPRING_API_URL", "http://localhost:8080/api"),
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export const reportsClient = axios.create({
  baseURL: resolveBaseUrl("VITE_ASPNET_API_URL", "http://localhost:5107/api"),
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(reportsAdminKey ? { "X-Admin-Key": reportsAdminKey } : {}),
  },
});

export const notificationsClient = axios.create({
  baseURL: resolveBaseUrl("VITE_NODE_API_URL", "http://localhost:4000/api"),
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export function buildAuthConfig(token) {
  if (!token) {
    return {};
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export function extractEnvelope(response) {
  return response?.data?.data ?? response?.data;
}

export function getErrorMessage(error) {
  const responseData = error?.response?.data;

  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    return responseData.errors.join(", ");
  }

  if (
    responseData?.errors &&
    typeof responseData.errors === "object" &&
    !Array.isArray(responseData.errors)
  ) {
    const nestedErrors = Object.entries(responseData.errors).flatMap(
      ([fieldName, value]) => {
        const messages = Array.isArray(value) ? value : [value];

        return messages
          .filter((entry) => typeof entry === "string" && entry.trim())
          .map((entry) => `${formatFieldLabel(fieldName)}: ${entry}`);
      },
    );

    if (nestedErrors.length > 0) {
      return nestedErrors.join(", ");
    }
  }

  if (typeof responseData?.message === "string" && responseData.message) {
    return responseData.message;
  }

  if (typeof responseData?.error === "string" && responseData.error) {
    return responseData.error;
  }

  return error?.message || "Request failed.";
}
