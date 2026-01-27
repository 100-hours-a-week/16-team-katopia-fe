import { API_BASE_URL } from "@/src/config/api";
import { getAccessToken, clearAccessToken } from "@/src/lib/auth";

export async function logout() {
  const token = getAccessToken();

  // AT 없으면 서버 호출 의미 없음
  if (!token) {
    clearAccessToken();
    return;
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/tokens`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include", // RT 쿠키 포함
  });

  // 401이어도 로그아웃은 진행
  clearAccessToken();

  if (!res.ok && res.status !== 401) {
    throw new Error("로그아웃 실패");
  }
}
