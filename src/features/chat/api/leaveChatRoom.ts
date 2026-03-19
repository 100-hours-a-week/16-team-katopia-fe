import { API_BASE_URL } from "@/src/config/api";
import { parseChatApiResponse } from "@/src/features/chat/api/parseChatApiResponse";
import { authFetch } from "@/src/lib/auth";

type LeaveChatRoomResponse = {
  message?: string;
};

export async function leaveChatRoom(roomId: string) {
  const res = await authFetch(
    `${API_BASE_URL}/api/chat/rooms/${roomId}/leave`,
    {
      method: "DELETE",
    },
  );

  const raw = await res.text();
  const parsed = parseChatApiResponse<LeaveChatRoomResponse>(raw);

  if (!res.ok) {
    const fallbackMessage = raw.trim() || "채팅방 나가기에 실패했습니다.";
    const message = parsed?.message ?? fallbackMessage;
    throw new Error(`(${res.status}) ${message}`);
  }
}
