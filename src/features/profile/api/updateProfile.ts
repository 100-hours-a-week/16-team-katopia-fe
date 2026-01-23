import { API_BASE_URL } from "@/src/config/api";
import { getAccessToken, issueAccessToken } from "@/src/lib/auth";

export type UpdateProfilePayload = {
  nickname?: string;
  profileImageUrl?: string | null; // ✅ URL만 보냄
  gender: "M" | "F";
  height?: number | null;
  weight?: number | null;
  enableRealtimeNotification?: boolean;
  style: string[];
};

export async function updateProfile(payload: UpdateProfilePayload) {
  console.log("updateProfile called", payload);

  let token = getAccessToken();
  if (!token) {
    try {
      token = await issueAccessToken();
    } catch {
      throw new Error("Access Token 없음");
    }
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/members`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "네트워크 오류로 요청 실패";
    throw new Error(message);
  }

  const raw = await res.text();
  const parsed = raw ? JSON.parse(raw) : null;

  if (!res.ok) {
    const message =
      (parsed as { message?: string } | null)?.message ?? "프로필 수정 실패";
    throw new Error(`(${res.status}) ${message}`);
  }

  return { status: res.status, body: parsed };
}
