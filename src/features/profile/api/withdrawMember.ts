import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export async function withdrawMember() {
  const res = await authFetch(`${API_BASE_URL}/api/members`, {
    method: "DELETE",
  });

  const raw = await res.text();
  const parsed = raw ? JSON.parse(raw) : null;

  if (!res.ok) {
    const message =
      (parsed as { message?: string } | null)?.message ??
      "회원 탈퇴에 실패했습니다.";
    throw new Error(`(${res.status}) ${message}`);
  }

  return { status: res.status, body: parsed };
}
