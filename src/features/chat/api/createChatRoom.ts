import { API_BASE_URL } from "@/src/config/api";
import { parseChatApiResponse } from "@/src/features/chat/api/parseChatApiResponse";
import { authFetch } from "@/src/lib/auth";

export type CreateChatRoomPayload = {
  title: string;
  thumbnailImageObjectKey: string;
};

type CreateChatRoomResponse = {
  data?: {
    id?: number | string;
    roomId?: number | string;
    title?: string;
    memberCount?: number;
    currentMemberCount?: number;
    thumbnailImageUrl?: string;
    thumbnailUrl?: string;
  };
  id?: number | string;
  roomId?: number | string;
  title?: string;
  memberCount?: number;
  currentMemberCount?: number;
  thumbnailImageUrl?: string;
  thumbnailUrl?: string;
  message?: string;
};

export async function createChatRoom(payload: CreateChatRoomPayload) {
  const res = await authFetch(`${API_BASE_URL}/api/chat/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  const parsed = parseChatApiResponse<CreateChatRoomResponse>(raw);

  if (!res.ok) {
    const fallbackMessage = raw.trim() || "채팅방 생성에 실패했습니다.";
    const message = parsed?.message ?? fallbackMessage;
    console.error("[createChatRoom] request failed", {
      status: res.status,
      body: raw.slice(0, 500),
    });
    throw new Error(`(${res.status}) ${message}`);
  }

  const data = parsed?.data ?? parsed ?? null;

  return {
    id: data?.id ?? data?.roomId,
    title: data?.title ?? payload.title,
    memberCount: data?.memberCount ?? data?.currentMemberCount ?? 1,
    thumbnailImageUrl: data?.thumbnailImageUrl ?? data?.thumbnailUrl,
  };
}
