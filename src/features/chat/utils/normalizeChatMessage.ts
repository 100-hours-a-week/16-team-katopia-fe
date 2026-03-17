export type NormalizedChatMessage = {
  id: string;
  roomId: string;
  senderId: string | null;
  senderNickname: string | null;
  senderProfileImageObjectKey: string | null;
  message: string;
  imageObjectKey: string | null;
  messageType: string;
  createdAt: string;
};

type ChatMessageCandidate = {
  id?: string | number | null;
  messageId?: string | number | null;
  roomId?: string | number | null;
  chatRoomId?: string | number | null;
  senderId?: string | number | null;
  memberId?: string | number | null;
  senderNicknameSnapshot?: string | null;
  senderNickname?: string | null;
  nickname?: string | null;
  senderProfileImageObjectKeySnapshot?: string | null;
  senderProfileImageObjectKey?: string | null;
  profileImageObjectKey?: string | null;
  message?: string | null;
  content?: string | null;
  imageObjectKey?: string | null;
  imageUrl?: string | null;
  messageType?: string | null;
  type?: string | null;
  createdAt?: string | null;
  createdDate?: string | null;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
};

export function normalizeChatMessage(
  input: unknown,
  fallbackRoomId = "",
): NormalizedChatMessage | null {
  const candidate = asRecord(input);
  if (!candidate) return null;

  const wrappedData = asRecord(candidate.data);
  const source = wrappedData ?? candidate;
  const item = source as ChatMessageCandidate;

  const rawId = item.id ?? item.messageId;
  const rawRoomId = item.roomId ?? item.chatRoomId ?? fallbackRoomId;
  const rawSenderId = item.senderId ?? item.memberId;

  if (rawId == null && !item.createdAt && !item.createdDate) {
    return null;
  }

  return {
    id:
      rawId != null
        ? String(rawId)
        : `${String(rawRoomId)}-${String(rawSenderId ?? "unknown")}-${String(
            item.createdAt ?? item.createdDate ?? Date.now(),
          )}`,
    roomId: String(rawRoomId ?? ""),
    senderId: rawSenderId != null ? String(rawSenderId) : null,
    senderNickname:
      item.senderNicknameSnapshot ?? item.senderNickname ?? item.nickname ?? null,
    senderProfileImageObjectKey:
      item.senderProfileImageObjectKeySnapshot ??
      item.senderProfileImageObjectKey ??
      item.profileImageObjectKey ??
      null,
    message: item.message ?? item.content ?? "",
    imageObjectKey: item.imageObjectKey ?? item.imageUrl ?? null,
    messageType: item.messageType ?? item.type ?? "TEXT",
    createdAt: item.createdAt ?? item.createdDate ?? new Date().toISOString(),
  };
}
