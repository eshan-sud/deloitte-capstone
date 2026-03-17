import axios from "axios";

function resolveBaseUrl(envName, fallback) {
  const value = import.meta.env[envName];

  if (typeof value === "string" && value.trim()) {
    return value.trim().replace(/\/+$/, "");
  }

  return fallback;
}

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

  if (responseData && typeof responseData.errors === "object") {
    return Object.values(responseData.errors).flat().filter(Boolean).join(", ");
  }

  if (typeof responseData?.message === "string" && responseData.message) {
    return responseData.message;
  }

  if (typeof responseData?.error === "string" && responseData.error) {
    return responseData.error;
  }

  return error?.message || "Request failed.";
}
