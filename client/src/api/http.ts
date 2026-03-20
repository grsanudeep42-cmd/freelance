import type { ApiResult } from "../types";

export async function getJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {})
      }
    });

    if (!res.ok) {
      return {
        ok: false,
        error: {
          message: `Request failed with status ${res.status}`,
          code: "HTTP_ERROR"
        }
      };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: {
        message: err instanceof Error ? err.message : "Unknown error",
        code: "NETWORK_ERROR"
      }
    };
  }
}

