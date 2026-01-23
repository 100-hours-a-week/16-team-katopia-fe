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

  setAccessToken(token);
  return token;
}
