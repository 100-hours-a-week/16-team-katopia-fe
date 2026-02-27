import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export async function deleteVote(voteId: number | string) {
  const res = await authFetch(`${API_BASE_URL}/api/votes/${voteId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const raw = await res.text();
    let message = "투표 삭제에 실패했습니다.";
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.message) message = parsed.message;
    } catch {
      // ignore parse errors
    }
    const error = new Error(message);
    (error as { status?: number }).status = res.status;
    throw error;
  }
}
