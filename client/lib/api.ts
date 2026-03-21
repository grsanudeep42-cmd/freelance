import axios from "axios";

export type Token = string;

let authToken: Token | null = null;

export function setAuthToken(token: Token | null): void {
  authToken = token;
}

export const api = axios.create({
  baseURL: "http://localhost:4000/api"
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
});

