import { API_BASE_URL } from "@/src/config/api";
import { parseChatApiResponse } from "@/src/features/chat/api/parseChatApiResponse";
import { authFetch } from "@/src/lib/auth";

type ChatMessageItem = {
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

type GetChatMessagesResponse = {
  messages?: ChatMessageItem[];
  nextCursor?: string | null;
  data?: {
    messages?: ChatMessageItem[];
    nextCursor?: string | null;
  };
  message?: string;
};

export async function getChatMessages(roomId: string, size = 20, after?: string) {
  const params = new URLSearchParams({ size: String(size) });
  if (after) params.set("after", after);

  const res = await authFetch(
    `${API_BASE_URL}/api/chat/rooms/${roomId}/messages?${params.toString()}`,
    { method: "GET" },
  );

  const raw = await res.text();
  const parsed = parseChatApiResponse<GetChatMessagesResponse>(raw);

  if (!res.ok) {
    const fallbackMessage = raw.trim() || "채팅 메시지 목록을 불러오지 못했습니다.";
    const message = parsed?.message ?? fallbackMessage;
    console.error("[getChatMessages] request failed", {
      status: res.status,
      body: raw.slice(0, 500),
    });
    throw new Error(`(${res.status}) ${message}`);
  }

  const messages = Array.isArray(parsed?.messages)
    ? parsed.messages
    : Array.isArray(parsed?.data?.messages)
      ? parsed.data.messages
      : [];

  return {
    messages: messages.map((item) => ({
      id: String(item.id ?? item.messageId ?? ""),
      messageId: item.messageId,
      roomId: item.roomId ?? roomId,
      senderId: item.senderId,
      senderNickname: item.senderNicknameSnapshot ?? null,
      senderProfileImageObjectKey:
        item.senderProfileImageObjectKeySnapshot ?? null,
      message: item.message ?? "",
      imageObjectKey: item.imageObjectKey ?? null,
      messageType: item.messageType ?? "TEXT",
      createdAt: item.createdAt ?? "",
    })),
    nextCursor: parsed?.nextCursor ?? parsed?.data?.nextCursor ?? null,
  };
}
