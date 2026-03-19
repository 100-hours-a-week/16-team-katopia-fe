import { API_BASE_URL } from "@/src/config/api";
import { parseChatApiResponse } from "@/src/features/chat/api/parseChatApiResponse";
import { authFetch } from "@/src/lib/auth";

type DeleteChatRoomResponse = {
  message?: string;
};

export async function deleteChatRoom(roomId: string) {
  const res = await authFetch(`${API_BASE_URL}/api/chat/rooms/${roomId}`, {
    method: "DELETE",
  });

  const raw = await res.text();
  const parsed = parseChatApiResponse<DeleteChatRoomResponse>(raw);

  if (!res.ok) {
    const fallbackMessage = raw.trim() || "채팅방 삭제에 실패했습니다.";
    const message = parsed?.message ?? fallbackMessage;
    throw new Error(`(${res.status}) ${message}`);
  }
}
