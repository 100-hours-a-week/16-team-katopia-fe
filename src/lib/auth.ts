import { API_BASE_URL } from "@/src/config/api";
/* =======================
 * Auth State (Module Scope)
 * ======================= */

let accessToken: string | null = null;
let authInvalidated = false;
let refreshPromise: Promise<string> | null = null;

const LOGOUT_FLAG_KEY = "katopia.loggedOut";
const HAS_LOGGED_IN_KEY = "katopia.hasLoggedIn";

/* =======================
 * Access Token
 * ======================= */

export function setAccessToken(token: string) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
}

/* =======================
 * Local / Session Storage
 * ======================= */

export function setLoggedOutFlag(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(LOGOUT_FLAG_KEY, "1");
    } else {
      window.localStorage.removeItem(LOGOUT_FLAG_KEY);
    }
  } catch {}
}

export function isLoggedOutFlag() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LOGOUT_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function setHasLoggedInFlag() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HAS_LOGGED_IN_KEY, "1");
  } catch {}
}

export function hasLoggedInFlag() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(HAS_LOGGED_IN_KEY) === "1";
  } catch {
    return false;
  }
}

/* =======================
 * Auth Invalid State
 * ======================= */

export function isAuthInvalidated() {
  return authInvalidated;
}

export function notifyAuthInvalid() {
  if (authInvalidated) return;

  // 로그인 리다이렉트 중이면 중복 이벤트 방지
  if (typeof window !== "undefined") {
    try {
      if (window.sessionStorage.getItem("katopia.loginRedirect") === "1") {
        return;
      }
    } catch {}
  }

  authInvalidated = true;
  clearAccessToken();
  setLoggedOutFlag(true);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:invalid"));
  }
}

/* =======================
 * Issue Access Token (RT → AT)
 * ======================= */

export async function issueAccessToken() {
  if (isLoggedOutFlag()) {
    // console.log("[issueAccessToken] blocked: loggedOutFlag");
    throw new Error("LOGGED_OUT");
  }
  // 🔐 재발급은 반드시 단일 Promise
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    // console.log("[issueAccessToken] request /api/auth/tokens start");
    const res = await fetch(`${API_BASE_URL}/api/auth/tokens`, {
      method: "POST",
      credentials: "include",
    });
    // console.log("[issueAccessToken] response", { status: res.status });

    if (!res.ok) {
      const body = await res
        .clone()
        .json()
        .catch(() => null);
      // console.log("[issueAccessToken] error body", body);
      if (typeof window !== "undefined") {
        try {
          const message = (body as { message?: string } | null)?.message ?? "";
          if (message) {
            window.sessionStorage.setItem(
              "katopia.authInvalidMessage",
              message,
            );
          } else {
            window.sessionStorage.removeItem("katopia.authInvalidMessage");
          }
        } catch {
          // ignore storage errors
        }
      }
      notifyAuthInvalid();
      throw new Error("RT expired");
    }

    const json = await res.json();
    // console.log("[issueAccessToken] success body", json);
    const token = json.data?.accessToken;

    if (!token) {
      // console.log("[issueAccessToken] missing accessToken");
      notifyAuthInvalid();
      throw new Error("No access token");
    }

    setAccessToken(token);
    setLoggedOutFlag(false);
    setHasLoggedInFlag();

    return token;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/* =======================
 * authFetch
 * ======================= */

type AuthFetchInit = RequestInit & { skipAuthRefresh?: boolean };

export async function authFetch(input: RequestInfo, init: AuthFetchInit = {}) {
  // 🔴 이미 세션 종료 상태면 요청 자체 차단
  if (authInvalidated) {
    // console.log("[authFetch] blocked: authInvalidated", {
    //   input,
    //   skipAuthRefresh: init.skipAuthRefresh,
    // });
    throw new Error("AUTH_INVALID");
  }
  if (isLoggedOutFlag()) {
    // console.log("[authFetch] blocked: loggedOutFlag", {
    //   input,
    //   skipAuthRefresh: init.skipAuthRefresh,
    // });
    throw new Error("LOGGED_OUT");
  }

  let token = getAccessToken();
  // console.log("[authFetch] start", {
  //   input,
  //   hasToken: Boolean(token),
  //   tokenPrefix: token ? token.slice(0, 10) : null,
  //   tokenLength: token?.length ?? 0,
  //   skipAuthRefresh: init.skipAuthRefresh,
  // });

  // AT 없으면 1회 재발급
  if (!token && !init.skipAuthRefresh) {
    // console.log("[authFetch] no token, issuing access token");
    token = await issueAccessToken(); // 실패 시 throw
    // console.log("[authFetch] issued access token", {
    //   hasToken: Boolean(token),
    // });
  }

  const makeHeaders = (bearer?: string) => {
    const headers = new Headers(init.headers || {});
    if (bearer) {
      headers.set("Authorization", `Bearer ${bearer}`);
    }
    return headers;
  };

  const requestHeaders = makeHeaders(token ?? undefined);
  // const authHeader = requestHeaders.get("Authorization") ?? "";
  // console.log("[authFetch] request headers", {
  //   input,
  //   hasAuthorization: Boolean(authHeader),
  //   authHeaderPrefix: authHeader ? authHeader.slice(0, 16) : null,
  //   credentials: init.credentials ?? "include",
  // });
  // 1차 요청
  let res = await fetch(input, {
    ...init,
    headers: requestHeaders,
    credentials: init.credentials ?? "include",
  });
  // console.log("[authFetch] response", {
  //   input,
  //   status: res.status,
  // });

  if (res.status !== 401 || init.skipAuthRefresh) {
    return res;
  }

  // 🔁 AT 만료 → 1회만 재발급 후 재시도
  try {
    // console.log("[authFetch] 401 received, refreshing token");
    const refreshed = await issueAccessToken();

    res = await fetch(input, {
      ...init,
      headers: makeHeaders(refreshed),
      credentials: init.credentials ?? "include",
    });
    // console.log("[authFetch] retry response", {
    //   input,
    //   status: res.status,
    // });

    if (res.status === 401) {
      // console.log("[authFetch] retry 401 -> auth invalid");
      notifyAuthInvalid();
      throw new Error("AUTH_INVALID");
    }

    return res;
  } catch {
    // console.log("[authFetch] refresh failed -> auth invalid");
    notifyAuthInvalid();
    throw new Error("AUTH_INVALID");
  }
}
