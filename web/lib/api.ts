import axios, { type InternalAxiosRequestConfig } from "axios";
import { TOKEN_KEY } from "./constants";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "") + "/api";

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

export type ApiResponse<T> = { ok?: boolean; data: T };

