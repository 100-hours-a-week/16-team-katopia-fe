let accessToken: string | null = null;
let authInvalidated = false;
const LOGOUT_FLAG_KEY = "katopia.loggedOut";

export function setAccessToken(token: string) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

export function setLoggedOutFlag(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(LOGOUT_FLAG_KEY, "1");
    } else {
      window.localStorage.removeItem(LOGOUT_FLAG_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function isLoggedOutFlag() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LOGOUT_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function isAuthInvalidated() {
  return authInvalidated;
}

export function notifyAuthInvalid() {
  if (authInvalidated) return;
  authInvalidated = true;
  clearAccessToken();
  setLoggedOutFlag(true);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:invalid"));
  }
}

import { API_BASE_URL } from "@/src/config/api";

export async function issueAccessToken() {
  const res = await fetch(`${API_BASE_URL}/api/auth/tokens`, {
    method: "POST",
    credentials: "include", // 🔥 Refresh Token 쿠키 포함
  });

  if (!res.ok) {
    if (res.status === 401) {
      notifyAuthInvalid();
    }
    throw new Error("Access Token 발급 실패");
  }

  const json = await res.json();
  const token = json.data?.accessToken;

  if (!token) {
    throw new Error("Access Token 없음");
  }

  console.log("access token issued", token);
  setAccessToken(token);
  authInvalidated = false;
  setLoggedOutFlag(false);
  return token;
}

type AuthFetchInit = RequestInit & { skipAuthRefresh?: boolean };

export async function authFetch(input: RequestInfo, init: AuthFetchInit = {}) {
  if (authInvalidated) {
    return new Response(null, { status: 401, statusText: "Unauthorized" });
  }
  let token = getAccessToken();
  if (!token) {
    try {
      token = await issueAccessToken();
    } catch {
      notifyAuthInvalid();
      token = null;
    }
  }

  const doFetch = (bearer?: string) => {
    const headers = new Headers(init.headers || {});
    if (bearer) {
      headers.set("Authorization", `Bearer ${bearer}`);
    }
    return fetch(input, {
      ...init,
      headers,
      credentials: init.credentials ?? "include",
    });
  };

  const res = await doFetch(token ?? undefined);
  if (res.status === 401 && !init.skipAuthRefresh) {
    notifyAuthInvalid();
  }
  return res;
}
