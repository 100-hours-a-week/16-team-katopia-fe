import { API_BASE_URL } from "@/src/config/api";
import { parseChatApiResponse } from "@/src/features/chat/api/parseChatApiResponse";
import { authFetch } from "@/src/lib/auth";

export type UpdateChatRoomPayload = {
  title: string;
  thumbnailImageObjectKey: string;
};

type UpdateChatRoomResponse = {
  message?: string;
};

export async function updateChatRoom(
  roomId: string,
  payload: UpdateChatRoomPayload,
) {
  const res = await authFetch(`${API_BASE_URL}/api/chat/rooms/${roomId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  const parsed = parseChatApiResponse<UpdateChatRoomResponse>(raw);

  if (!res.ok) {
    const fallbackMessage = raw.trim() || "채팅방 수정에 실패했습니다.";
    const message = parsed?.message ?? fallbackMessage;
    throw new Error(`(${res.status}) ${message}`);
  }
}
