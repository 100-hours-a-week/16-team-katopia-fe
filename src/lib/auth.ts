let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
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
    return res;
  }

  try {
    const refreshed = await issueAccessToken();
    res = await doFetch(refreshed);
  } catch {
    // refresh failed, return original 401 response
  }

  return res;
}
