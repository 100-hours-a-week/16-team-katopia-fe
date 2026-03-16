import { API_BASE_URL } from "@/src/config/api";
import { parseChatApiResponse } from "@/src/features/chat/api/parseChatApiResponse";
import { authFetch } from "@/src/lib/auth";

type JoinChatRoomResponse = {
  data?: {
    roomId?: string;
    title?: string;
    participantCount?: number;
    joined?: boolean;
  };
  roomId?: string;
  title?: string;
  participantCount?: number;
  joined?: boolean;
  message?: string;
};

export async function joinChatRoom(roomId: string) {
  const res = await authFetch(`${API_BASE_URL}/api/chat/rooms/${roomId}/join`, {
    method: "POST",
  });

  const raw = await res.text();
  const parsed = parseChatApiResponse<JoinChatRoomResponse>(raw);

  if (!res.ok) {
    const fallbackMessage = raw.trim() || "채팅방 참여에 실패했습니다.";
    const message = parsed?.message ?? fallbackMessage;
    console.error("[joinChatRoom] request failed", {
      status: res.status,
      body: raw.slice(0, 500),
    });
    throw new Error(`(${res.status}) ${message}`);
  }

  const data = parsed?.data ?? parsed ?? null;

  return {
    roomId: data?.roomId ?? roomId,
    title: data?.title ?? "",
    participantCount: data?.participantCount,
    joined: data?.joined,
  };
}
