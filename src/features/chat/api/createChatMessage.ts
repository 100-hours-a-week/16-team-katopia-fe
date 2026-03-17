import { API_BASE_URL } from "@/src/config/api";
import { parseChatApiResponse } from "@/src/features/chat/api/parseChatApiResponse";
import { authFetch } from "@/src/lib/auth";

export type CreateChatMessagePayload = {
  message?: string;
  imageObjectKey?: string;
};

type CreateChatMessageResponse = {
  data?: {
    id?: string;
    messageId?: string | number;
    roomId?: string;
    senderId?: string | number;
    senderNicknameSnapshot?: string;
    senderProfileImageObjectKeySnapshot?: string | null;
    message?: string;
    imageObjectKey?: string | null;
    messageType?: string;
    createdAt?: string;
  };
  id?: string;
  messageId?: string | number;
  roomId?: string;
  senderId?: string | number;
  senderNicknameSnapshot?: string;
  senderProfileImageObjectKeySnapshot?: string | null;
  message?: string;
  imageObjectKey?: string | null;
  messageType?: string;
  createdAt?: string;
  error?: string;
  messageText?: string;
  message?: string;
};

export async function createChatMessage(
  roomId: string,
  payload: CreateChatMessagePayload,
) {
  const res = await authFetch(
    `${API_BASE_URL}/api/chat/rooms/${roomId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  const raw = await res.text();
  const parsed = parseChatApiResponse<CreateChatMessageResponse>(raw);

  if (!res.ok) {
    const fallbackMessage = raw.trim() || "채팅 메시지 생성에 실패했습니다.";
    const message =
      parsed?.error ??
      parsed?.messageText ??
      parsed?.message ??
      fallbackMessage;
    console.error("[createChatMessage] request failed", {
      status: res.status,
      body: raw.slice(0, 500),
    });
    throw new Error(`(${res.status}) ${message}`);
  }

  const data = parsed?.data ?? parsed ?? null;

  return {
    id: String(data?.id ?? data?.messageId ?? crypto.randomUUID()),
    roomId: data?.roomId ?? roomId,
    senderId: data?.senderId,
    senderNickname: data?.senderNicknameSnapshot ?? null,
    senderProfileImageObjectKey:
      data?.senderProfileImageObjectKeySnapshot ?? null,
    message: data?.message ?? payload.message ?? "",
    imageObjectKey: data?.imageObjectKey ?? null,
    messageType: data?.messageType ?? "TEXT",
    createdAt: data?.createdAt ?? new Date().toISOString(),
  };
}
