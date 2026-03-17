import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import type { NormalizedChatMessage } from "@/src/features/chat/utils/normalizeChatMessage";
import type { ReadStateParticipant } from "@/src/features/chat/utils/readStateUtils";

export type ChatMessage = {
  id: string;
  messageId: number | null;
  direction: "left" | "right";
  senderId?: string | null;
  senderNickname?: string | null;
  senderProfileImageUrl?: string | null;
  message: string;
  imageUrl?: string | null;
  createdAt?: string;
  optimistic?: boolean;
};

export function parseNumericMessageId(value: string) {
  const numericId = Number(value);
  return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
}

export function toUiMessage(
  message: NormalizedChatMessage | null,
  currentMemberId?: string | number | null,
): ChatMessage | null {
  if (!message) return null;

  return {
    id: message.id,
    messageId: message.messageId,
    senderId: message.senderId,
    direction:
      String(message.senderId ?? "") === String(currentMemberId ?? "")
        ? "right"
        : "left",
    senderNickname: message.senderNickname,
    senderProfileImageUrl: resolveMediaUrl(
      message.senderProfileImageObjectKey,
    ),
    message: message.imageObjectKey ? "" : message.message,
    imageUrl: message.imageObjectKey
      ? resolveMediaUrl(message.imageObjectKey)
      : null,
    createdAt: message.createdAt,
    optimistic: false,
  };
}

export function isChatMessage(value: ChatMessage | null): value is ChatMessage {
  return value !== null;
}

export function sortChatMessagesAsc(messages: ChatMessage[]) {
  return [...messages].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    if (aTime !== bTime) {
      return aTime - bTime;
    }

    const aId = Number(a.id);
    const bId = Number(b.id);
    if (Number.isFinite(aId) && Number.isFinite(bId) && aId !== bId) {
      return aId - bId;
    }

    return String(a.id).localeCompare(String(b.id));
  });
}

export function mergeChatMessages(prev: ChatMessage[], next: ChatMessage) {
  const existingIndex = prev.findIndex((item) => item.id === next.id);
  if (existingIndex >= 0) {
    const copy = [...prev];
    copy[existingIndex] = next;
    return copy;
  }

  return sortChatMessagesAsc([...prev, next]);
}

export function reconcileIncomingMessage(
  prev: ChatMessage[],
  next: ChatMessage,
  isOwnMessage: boolean,
) {
  if (isOwnMessage) {
    const optimisticIndex = prev.findIndex((item) => {
      if (item.optimistic !== true || item.direction !== "right") {
        return false;
      }

      const itemHasImage = Boolean(item.imageUrl);
      const nextHasImage = Boolean(next.imageUrl);
      if (itemHasImage !== nextHasImage) {
        return false;
      }

      return item.message === next.message;
    });

    if (optimisticIndex >= 0) {
      const copy = [...prev];
      copy[optimisticIndex] = {
        ...next,
        optimistic: false,
      };
      return copy;
    }
  }

  return mergeChatMessages(prev, next);
}

export function getLastReadableMessageId(messages: ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const current = messages[index];
    if (current?.optimistic) continue;

    const numericId = current.messageId ?? parseNumericMessageId(current.id);
    if (numericId !== null) {
      return numericId;
    }
  }

  return null;
}

export function getUnreadCountForMessage({
  message,
  participants,
  roomMemberCount,
}: {
  message: ChatMessage;
  participants: Record<string, ReadStateParticipant>;
  roomMemberCount: number;
}) {
  const messageId = message.messageId ?? parseNumericMessageId(message.id);
  if (!messageId) return null;

  const senderId = String(message.senderId ?? "");
  const totalOtherParticipants = Math.max(roomMemberCount - 1, 0);
  if (totalOtherParticipants === 0) return 0;

  const readCount = Object.values(participants).filter((participant) => {
    if (String(participant.memberId) === senderId) {
      return false;
    }

    return participant.lastReadMessageId >= messageId;
  }).length;

  return Math.max(totalOtherParticipants - readCount, 0);
}

export function buildUnreadCountByMessageId({
  messages,
  participants,
  roomMemberCount,
}: {
  messages: ChatMessage[];
  participants: Record<string, ReadStateParticipant>;
  roomMemberCount: number;
}) {
  const unreadCountByMessageId: Record<number, number> = {};

  messages.forEach((message) => {
    const messageId = message.messageId ?? parseNumericMessageId(message.id);
    if (!messageId) return;

    unreadCountByMessageId[messageId] =
      getUnreadCountForMessage({
        message,
        participants,
        roomMemberCount,
      }) ?? 0;
  });

  return unreadCountByMessageId;
}

export function formatMessageTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}
