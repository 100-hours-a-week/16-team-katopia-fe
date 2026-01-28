let accessToken: string | null = null;
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

export function notifyAuthInvalid(
  payload: { code?: string } | null | undefined,
) {
  if (payload?.code !== "AUTH-E-011") return;
  clearAccessToken();
  setLoggedOutFlag(true);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:invalid"));
  }
}

export async function issueAccessToken() {
  const res = await fetch("https://dev.fitcheck.kr/api/auth/tokens", {
    method: "POST",
    credentials: "include", // 🔥 Refresh Token 쿠키 포함
  });

  if (!res.ok) {
    throw new Error("Access Token 발급 실패");
  }

  const json = await res.json();
  const token = json.data?.accessToken;

  if (!token) {
    throw new Error("Access Token 없음");
  }

  console.log("access token issued", token);
  setAccessToken(token);
  setLoggedOutFlag(false);
  return token;
}

type AuthFetchInit = RequestInit & { skipAuthRefresh?: boolean };

export async function authFetch(input: RequestInfo, init: AuthFetchInit = {}) {
  let token = getAccessToken();
  if (!token) {
    try {
      token = await issueAccessToken();
    } catch {
      token = null;
    }
  }

  const notifyAuthInvalidResponse = async (res: Response) => {
    if (res.status !== 401) return;
    try {
      const clone = res.clone();
      const data = await clone.json();
      notifyAuthInvalid(data);
    } catch {
      // ignore parse errors
    }
  };

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

  let res = await doFetch(token ?? undefined);
  if (res.status !== 401 || init.skipAuthRefresh) {
    await notifyAuthInvalidResponse(res);
    return res;
  }

  try {
    const refreshed = await issueAccessToken();
    res = await doFetch(refreshed);
  } catch {
    // refresh failed, return original 401 response
  }

  await notifyAuthInvalidResponse(res);
  return res;
}
