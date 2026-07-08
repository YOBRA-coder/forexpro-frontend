// ─── API client ───────────────────────────────────────────────────────────────
import { useCallback } from "react";

// ─── Config ──────────────────────────────────────────────────────────────────
// Single source of truth for the backend origin. Swap this one line for
// production (e.g. your Railway/Render URL) and every REST + WebSocket
// call in the app follows automatically.
//const API = "http://localhost:8766";
const API = "https://forexpro-backend-7ik2.onrender.com";

// wss:// when the API is https://, ws:// when it's http:// — always in sync with API.
const WS_BASE = API.replace(/^https/, "wss");

function useApi(token) {
  const req = useCallback(async (method, path, body) => {
    const res = await fetch(API + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
    return data;
  }, [token]);

  return {
    get:  (p)    => req("GET",    p),
    post: (p, b) => req("POST",   p, b),
    put:  (p, b) => req("PUT",    p, b),
    del:  (p)    => req("DELETE", p),
  };
}

export { useApi, API, WS_BASE };
