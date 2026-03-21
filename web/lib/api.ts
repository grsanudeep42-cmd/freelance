import axios, { type AxiosRequestConfig } from "axios";
import { TOKEN_KEY } from "./constants";

export const api = axios.create({
  baseURL: "http://localhost:4000/api"
});

api.interceptors.request.use((config: AxiosRequestConfig) => {
  const token =
    typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type ApiResponse<T> = { ok?: boolean; data: T };

