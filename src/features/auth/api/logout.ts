import { API_BASE_URL } from "@/src/config/api";
import {
  getAccessToken,
  clearAccessToken,
  setLoggedOutFlag,
} from "@/src/lib/auth";

export async function logout() {
  const token = getAccessToken();
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/api/auth/tokens`, {
    method: "DELETE",
    headers,
    credentials: "include", // RT 쿠키 포함
  });

  // 401이어도 로그아웃은 진행
  clearAccessToken();
  setLoggedOutFlag(true);

  if (!res.ok && res.status !== 401) {
    throw new Error("로그아웃 실패");
  }
}
