import axios, {
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from "axios";
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from "./constants";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "") + "/api";

export const api = axios.create({
  baseURL: API_BASE,
});

// ─── Request interceptor: attach access token ──────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// ─── Response interceptor: refresh on 401 ─────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401, and don't retry refresh/login/register calls
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the in-flight refresh completes
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.set("Authorization", `Bearer ${token}`);
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken =
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      // No refresh token available — clear auth and redirect
      isRefreshing = false;
      processQueue(error, null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    try {
      // Call the refresh endpoint with a raw axios instance (not `api`)
      // to avoid the interceptor loop
      const res = await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken,
      });

      const newAccessToken: string =
        res.data?.data?.accessToken ?? res.data?.accessToken;
      const newRefreshToken: string | undefined =
        res.data?.data?.refreshToken ?? res.data?.refreshToken;

      if (!newAccessToken) throw new Error("No access token in refresh response");

      // Store new tokens
      localStorage.setItem(TOKEN_KEY, newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }

      // Retry original request with new token
      originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
      processQueue(null, newAccessToken);
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed — clear everything and redirect to login
      processQueue(refreshError, null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export type ApiResponse<T> = { ok?: boolean; data: T };
