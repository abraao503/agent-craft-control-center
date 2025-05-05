import axios, { InternalAxiosRequestConfig } from "axios";
import { trackApiError } from "./errorTracking";
import { HighlightService } from "@/lib/highlight";

// Extend the axios request config type to include our custom property
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _requestStartTime?: number;
}

const baseURL =
  import.meta.env.VITE_API_URL ||
  "https://cooing-quintina-abraaos-cb124017.koyeb.app";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to track API calls
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Track API request in Highlight if enabled
  if (import.meta.env.VITE_HIGHLIGHT_ENABLED === "true") {
    // Add a unique request ID to correlate request and response
    const requestId = `req_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    config.headers["X-Request-ID"] = requestId;

    // Track the API request
    HighlightService.trackEvent("api_request_start", {
      url: config.url || "unknown",
      method: config.method?.toUpperCase() || "unknown",
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  return config;
});

const removeUserData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

api.interceptors.response.use(
  (response) => {
    // Track successful API response
    if (import.meta.env.VITE_HIGHLIGHT_ENABLED === "true") {
      const requestId = response.config.headers["X-Request-ID"];

      HighlightService.trackEvent("api_request_success", {
        url: response.config.url || "unknown",
        method: response.config.method?.toUpperCase() || "unknown",
        status: response.status,
        requestId,
        timestamp: new Date().toISOString(),
        duration: calculateDuration(response.config as CustomRequestConfig),
      });
    }

    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        "Erro da API:",
        error.response.data.message || "Erro desconhecido"
      );

      if (error.response.status === 401) {
        removeUserData();
        window.location.href = "/";
      }

      // Track the API error with Highlight
      if (import.meta.env.VITE_HIGHLIGHT_ENABLED === "true") {
        const context = `${error.config.method?.toUpperCase() || "unknown"} ${
          error.config.url || "unknown"
        }`;
        trackApiError(error, context);
      }
    } else if (error.request) {
      console.error("Sem resposta do servidor");

      // Track network errors
      if (import.meta.env.VITE_HIGHLIGHT_ENABLED === "true") {
        const networkError = new Error(
          "Network error: No response from server"
        );
        HighlightService.reportError(networkError, "API network error", {
          url: error.config?.url || "unknown",
          method: error.config?.method?.toUpperCase() || "unknown",
        });
      }
    } else {
      console.error("Erro desconhecido", error.message);

      // Track unexpected errors
      if (import.meta.env.VITE_HIGHLIGHT_ENABLED === "true") {
        HighlightService.reportError(error, "Unexpected API error", {
          message: error.message,
        });
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to calculate request duration
function calculateDuration(config: CustomRequestConfig): number {
  if (config._requestStartTime) {
    return Date.now() - config._requestStartTime;
  }
  return 0;
}

// Add timestamp to track request duration
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  (config as CustomRequestConfig)._requestStartTime = Date.now();
  return config;
});
