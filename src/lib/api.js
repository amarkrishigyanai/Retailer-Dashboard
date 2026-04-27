import axios from "axios";
import theme from "../config/theme";
import { getToken } from "./tokenStorage";

const api = axios.create({
  baseURL: theme.apiBase,
});

// ✅ Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    // Strip token from registration responses so new-user tokens
    // never overwrite the logged-in FPO session
    const url = response.config?.url || "";
    if (
      response.data?.token &&
      !url.includes("/signin") &&
      !url.includes("/otp/verify-otp")
    ) {
      delete response.data.token;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Lazy import avoids circular dependency (store → api → store)
      import("../store/store").then(({ default: store }) => {
        store.dispatch({ type: "auth/logout" });
      });
    }
    return Promise.reject(error);
  },
);

export default api;
