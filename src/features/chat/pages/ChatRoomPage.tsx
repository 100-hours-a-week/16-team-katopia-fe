"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { deleteChatRoom } from "@/src/features/chat/api/deleteChatRoom";
import { getChatMessages } from "@/src/features/chat/api/getChatMessages";
import { getMyChatRooms } from "@/src/features/chat/api/getMyChatRooms";
import { leaveChatRoom } from "@/src/features/chat/api/leaveChatRoom";
import CreateChatRoomModal from "@/src/features/chat/components/CreateChatRoomModal";
import {
  DEFAULT_CHAT_ROOM_IMAGES,
  DEFAULT_CHAT_ROOM_THUMBNAIL_OBJECT_KEY,
} from "@/src/features/chat/constants";
import { useChatSocketConnection } from "@/src/features/chat/hooks/useChatSocketConnection";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import { updateChatRoom } from "@/src/features/chat/api/updateChatRoom";
import {
  normalizeChatMessage,
  type NormalizedChatMessage,
} from "@/src/features/chat/utils/normalizeChatMessage";
import { markChatRoomReadOverride } from "@/src/features/chat/utils/chatReadOverride";
import { processImageFile } from "@/src/features/upload/utils/processImage";
import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";

type ChatRoomPageProps = {
  roomId: string;
  initialTitle?: string;
  initialMemberCount?: string;
  initialThumbnail?: string;
  initialThumbnailObjectKey?: string;
  initialIsOwner?: string;
};

type ChatMessage = {
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

type ReadStateParticipant = {
  memberId: string;
  lastReadMessageId: number;
  acknowledgedAt?: string;
};

function buildChatRoomSubscribeDestination(roomId: string) {
  return `/topic/chat/rooms/${roomId}/messages`;
}

function buildChatRoomReadStateSubscribeDestination(roomId: string) {
  return `/topic/chat/rooms/${roomId}/read-state`;
}

const CHAT_MESSAGE_SUBSCRIPTION_ID = "sub-messages";
const CHAT_READ_STATE_SUBSCRIPTION_ID = "sub-read-state";
const CHAT_MESSAGE_SEND_DESTINATION = "/app/chat.message";
const CHAT_READ_STATE_SEND_DESTINATION = "/app/chat.read-state";

function toUiMessage(
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

function isChatMessage(value: ChatMessage | null): value is ChatMessage {
  return value !== null;
}

function mergeChatMessages(prev: ChatMessage[], next: ChatMessage) {
  const existingIndex = prev.findIndex((item) => item.id === next.id);
  if (existingIndex >= 0) {
    const copy = [...prev];
    copy[existingIndex] = next;
    return copy;
  }

  return sortChatMessagesAsc([...prev, next]);
}

function reconcileIncomingMessage(
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

      // 이미지 메시지는 blob preview URL과 서버 URL이 다르므로
      // "이미지 포함 여부 + 텍스트" 기준으로 동일 메시지로 본다.
      if (itemHasImage && nextHasImage) {
        return item.message === next.message;
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

function getLastReadableMessageId(messages: ChatMessage[]) {
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

function parseNumericMessageId(value: string) {
  const numericId = Number(value);
  return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
}

function normalizeReadStateParticipants(
  payload: unknown,
): ReadStateParticipant[] {
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  const wrappedData =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : null;
  const source = wrappedData ?? record;

  const participantsSource = Array.isArray(source.participants)
    ? source.participants
    : [source];

  return participantsSource.reduce<ReadStateParticipant[]>((acc, participant) => {
    if (!participant || typeof participant !== "object") return acc;

    const item = participant as Record<string, unknown>;
    const memberId = item.memberId;
    const lastReadMessageId = item.lastReadMessageId;

    if (memberId == null || lastReadMessageId == null) return acc;

    const numericLastReadMessageId = Number(lastReadMessageId);
    if (
      !Number.isFinite(numericLastReadMessageId) ||
      numericLastReadMessageId <= 0
    ) {
      return acc;
    }

    acc.push({
      memberId: String(memberId),
      lastReadMessageId: numericLastReadMessageId,
      acknowledgedAt:
        typeof item.acknowledgedAt === "string" ? item.acknowledgedAt : undefined,
    });

    return acc;
  }, []);
}

function mergeReadStateParticipants(
  prev: Record<string, ReadStateParticipant>,
  nextParticipants: ReadStateParticipant[],
) {
  if (nextParticipants.length === 0) return prev;

  const merged = { ...prev };

  nextParticipants.forEach((participant) => {
    const previous = merged[participant.memberId];
    if (
      !previous ||
      participant.lastReadMessageId >= previous.lastReadMessageId
    ) {
      merged[participant.memberId] = participant;
    }
  });

  return merged;
}

function getUnreadCountForMessage({
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

function buildUnreadCountByMessageId({
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

    unreadCountByMessageId[messageId] = getUnreadCountForMessage({
      message,
      participants,
      roomMemberCount,
    }) ?? 0;
  });

  return unreadCountByMessageId;
}

function sortChatMessagesAsc(messages: ChatMessage[]) {
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

function formatMessageTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function ChatBubble({
  direction,
  senderNickname,
  senderProfileImageUrl,
  message,
  imageUrl,
  createdAt,
  unreadCount,
  onImageClick,
}: {
  direction: "left" | "right";
  senderNickname?: string | null;
  senderProfileImageUrl?: string | null;
  message: string;
  imageUrl?: string | null;
  createdAt?: string;
  unreadCount?: number | null;
  onImageClick?: (imageUrl: string) => void;
}) {
  const isRight = direction === "right";
  const formattedTime = formatMessageTime(createdAt);

  const bubbleContent = imageUrl ? (
    <div className="overflow-hidden rounded-[18px]">
      <div className="w-[min(62vw,240px)] bg-[#e7e7e7]">
        <button
          type="button"
          onClick={() => onImageClick?.(imageUrl)}
          className="block w-full"
          aria-label="이미지 크게 보기"
        >
          <img
            src={imageUrl}
            alt=""
            className="block h-auto max-h-[300px] w-full object-contain"
          />
        </button>
      </div>
      {message ? (
        <p className="px-4 pb-4 pt-3 text-[14px] leading-6 text-[#111111]">
          {message}
        </p>
      ) : null}
    </div>
  ) : (
    <p className="break-words px-4 py-3.5">{message}</p>
  );

  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-end gap-2 ${
          isRight
            ? "max-w-[min(78%,280px)] flex-nowrap"
            : "max-w-[min(88%,320px)] items-start gap-3"
        }`}
      >
        {!isRight ? (
          <div className="flex shrink-0 flex-col items-center">
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-[#dddddd]">
              <Image
                src={senderProfileImageUrl || "/images/chat_default.png"}
                alt=""
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}
        {!isRight ? (
          <div className="min-w-0">
            {senderNickname ? (
              <p className="mb-1 px-1 text-[12px] font-medium text-[#666666]">
                {senderNickname}
              </p>
            ) : null}
            <div className="flex items-end gap-2">
              <div className="max-w-[280px] rounded-[22px] bg-[#f1f1f1] text-[14px] leading-6 text-[#111111]">
                {bubbleContent}
              </div>
              <div className="flex shrink-0 flex-col items-start px-1">
                {typeof unreadCount === "number" && unreadCount > 0 ? (
                  <span className="whitespace-nowrap text-[11px] font-medium text-[#9a9a9a]">
                    {unreadCount}
                  </span>
                ) : null}
                {formattedTime && (
                  <span className="whitespace-nowrap text-[11px] text-[#9a9a9a]">
                    {formattedTime}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : null}
        {isRight ? (
          <>
            <div className="flex shrink-0 flex-col items-end px-1">
              {typeof unreadCount === "number" && unreadCount > 0 ? (
                <span className="whitespace-nowrap text-[11px] font-medium text-[#9a9a9a]">
                  {unreadCount}
                </span>
              ) : null}
              {formattedTime ? (
                <span className="whitespace-nowrap text-[11px] text-[#9a9a9a]">
                  {formattedTime}
                </span>
              ) : null}
            </div>
            <div className="min-w-0 max-w-[280px] rounded-bl-[22px] rounded-br-[22px] rounded-tl-[22px] rounded-tr-none bg-[#d3d3d3] text-[14px] leading-6 text-[#111111]">
              {bubbleContent}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function ChatRoomPage({
  roomId,
  initialTitle,
  initialMemberCount,
  initialThumbnail,
  initialThumbnailObjectKey,
  initialIsOwner,
}: ChatRoomPageProps) {
  const router = useRouter();
  const { currentMember, isAuthenticated, ready } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roomTitle, setRoomTitle] = useState(
    initialTitle?.trim() || "패션에 고민있는 사람 모여라!!!!!",
  );
  const [roomThumbnailSrc, setRoomThumbnailSrc] = useState(
    initialThumbnail?.trim() || "/images/chat_default.png",
  );
  const [roomThumbnailObjectKey, setRoomThumbnailObjectKey] = useState(
    initialThumbnailObjectKey?.trim() || "",
  );
  const [editTitle, setEditTitle] = useState(
    initialTitle?.trim() || "패션에 고민있는 사람 모여라!!!!!",
  );
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<
    string | null
  >(initialThumbnail?.trim() || null);
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [editSelectedDefaultThumbnail, setEditSelectedDefaultThumbnail] =
    useState<string | null>(null);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);
  const [roomMemberCount, setRoomMemberCount] = useState(
    Number(initialMemberCount) > 0 ? Number(initialMemberCount) : 15,
  );
  const [resolvedIsOwner, setResolvedIsOwner] = useState(
    initialIsOwner === "1",
  );
  const [messageInput, setMessageInput] = useState("");
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(
    null,
  );
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [readStateParticipants, setReadStateParticipants] = useState<
    Record<string, ReadStateParticipant>
  >({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [nextMessagesCursor, setNextMessagesCursor] = useState<string | null>(
    null,
  );
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const menuAreaRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  const messageImageInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const prependScrollHeightRef = useRef<number | null>(null);
  const isPrependingMessagesRef = useRef(false);
  const hasEditedTitle = editTitle.trim() !== roomTitle.trim();
  const hasEditedThumbnail =
    Boolean(editThumbnailFile) ||
    (editSelectedDefaultThumbnail !== null &&
      editSelectedDefaultThumbnail !== roomThumbnailSrc);
  const canSubmitEdit = Boolean(
    editTitle.trim() &&
    editThumbnailPreview &&
    !isUpdatingRoom &&
    (hasEditedTitle || hasEditedThumbnail),
  );
  const {
    status: socketStatus,
    subscribe,
    publish,
  } = useChatSocketConnection({
    enabled: ready && isAuthenticated,
  });
  const unreadCountByMessageId = useMemo(
    () =>
      buildUnreadCountByMessageId({
        messages,
        participants: readStateParticipants,
        roomMemberCount,
      }),
    [messages, readStateParticipants, roomMemberCount],
  );

  useEffect(() => {
    let cancelled = false;

    const loadRoomSummary = async () => {
      try {
        const response = await getMyChatRooms();
        if (cancelled) return;

        const currentRoom = response.rooms.find(
          (room) => String(room.id) === String(roomId),
        );
        if (!currentRoom) return;

        setResolvedIsOwner(Boolean(currentRoom.isOwner));
        setRoomTitle(currentRoom.title);
        setEditTitle(currentRoom.title);
        setRoomMemberCount(currentRoom.memberCount);

        if (currentRoom.thumbnailImageObjectKey) {
          setRoomThumbnailObjectKey(currentRoom.thumbnailImageObjectKey);
        }

        if (currentRoom.thumbnailImageUrl) {
          setRoomThumbnailSrc(currentRoom.thumbnailImageUrl);
          setEditThumbnailPreview(currentRoom.thumbnailImageUrl);
        }
      } catch {
        // 상세 페이지는 쿼리 파라미터 기본값으로도 렌더 가능하므로 복원 실패는 무시
      }
    };

    void loadRoomSummary();

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  useEffect(() => {
    return () => {
      if (editThumbnailPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(editThumbnailPreview);
      }
    };
  }, [editThumbnailPreview]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuAreaRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        setMessagesError(null);
        const response = await getChatMessages(roomId);
        if (cancelled) return;

        setMessages(
          sortChatMessagesAsc(
            response.messages
              .map((item) => toUiMessage(item, currentMember?.id))
              .filter(isChatMessage),
          ),
        );
        setNextMessagesCursor(response.nextCursor);
      } catch (error) {
        if (cancelled) return;
        setMessagesError(
          error instanceof Error
            ? error.message
            : "채팅 메시지를 불러오지 못했습니다.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingMessages(false);
        }
      }
    };

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [currentMember?.id, roomId]);

  useEffect(() => {
    if (socketStatus !== "connected") return;

    let messageSubscription: StompSubscription | null = null;
    let readStateSubscription: StompSubscription | null = null;
    const messageDestination = buildChatRoomSubscribeDestination(roomId);
    const readStateDestination =
      buildChatRoomReadStateSubscribeDestination(roomId);

    const handleMessage = (frame: IMessage) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("[chat:subscribe] frame received", {
          roomId,
          destination: messageDestination,
          body: frame.body,
          headers: frame.headers,
        });
      }

      const rawBody = frame.body?.trim();
      if (!rawBody) return;

      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        return;
      }

      const normalized = normalizeChatMessage(parsedBody, roomId);
      if (!normalized) return;
      if (String(normalized.roomId) !== String(roomId)) return;

      const nextMessage = toUiMessage(normalized, currentMember?.id);
      if (!nextMessage) return;

      const isOwnMessage =
        String(normalized.senderId ?? "") === String(currentMember?.id ?? "");

      setMessages((prev) =>
        reconcileIncomingMessage(prev, nextMessage, isOwnMessage),
      );
    };

    const handleReadState = (frame: IMessage) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("[chat:read-state] frame received", {
          roomId,
          destination: readStateDestination,
          body: frame.body,
          headers: frame.headers,
        });
      }

      const rawBody = frame.body?.trim();
      if (!rawBody) return;

      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        return;
      }

      const nextParticipants = normalizeReadStateParticipants(parsedBody);
      if (nextParticipants.length === 0) return;

      setReadStateParticipants((prev) =>
        mergeReadStateParticipants(prev, nextParticipants),
      );

      if (process.env.NODE_ENV !== "production") {
        console.log("[chat:read-state] merged participants", {
          roomId,
          participants: mergeReadStateParticipants(
            readStateParticipants,
            nextParticipants,
          ),
        });
      }
    };

    messageSubscription = subscribe(messageDestination, handleMessage, {
      id: CHAT_MESSAGE_SUBSCRIPTION_ID,
    });
    readStateSubscription = subscribe(readStateDestination, handleReadState, {
      id: CHAT_READ_STATE_SUBSCRIPTION_ID,
    });

    if (process.env.NODE_ENV !== "production") {
      if (messageSubscription) {
        console.log("[chat:subscribe] subscribed", {
          roomId,
          destination: messageDestination,
          subscriptionId: CHAT_MESSAGE_SUBSCRIPTION_ID,
          socketStatus,
        });
      } else {
        console.warn("[chat:subscribe] subscribe skipped", {
          roomId,
          destination: messageDestination,
          subscriptionId: CHAT_MESSAGE_SUBSCRIPTION_ID,
          socketStatus,
        });
      }

      if (readStateSubscription) {
        console.log("[chat:read-state] subscribed", {
          roomId,
          destination: readStateDestination,
          subscriptionId: CHAT_READ_STATE_SUBSCRIPTION_ID,
          socketStatus,
        });
      } else {
        console.warn("[chat:read-state] subscribe skipped", {
          roomId,
          destination: readStateDestination,
          subscriptionId: CHAT_READ_STATE_SUBSCRIPTION_ID,
          socketStatus,
        });
      }
    }

    return () => {
      if (process.env.NODE_ENV !== "production" && messageSubscription) {
        console.log("[chat:subscribe] unsubscribed", {
          roomId,
          destination: messageDestination,
          subscriptionId: CHAT_MESSAGE_SUBSCRIPTION_ID,
        });
      }
      if (process.env.NODE_ENV !== "production" && readStateSubscription) {
        console.log("[chat:read-state] unsubscribed", {
          roomId,
          destination: readStateDestination,
          subscriptionId: CHAT_READ_STATE_SUBSCRIPTION_ID,
        });
      }
      messageSubscription?.unsubscribe();
      readStateSubscription?.unsubscribe();
    };
  }, [currentMember?.id, roomId, socketStatus, subscribe]);

  useEffect(() => {
    if (prependScrollHeightRef.current == null) return;

    const previousScrollHeight = prependScrollHeightRef.current;
    prependScrollHeightRef.current = null;

    const frameId = window.requestAnimationFrame(() => {
      const nextScrollHeight = document.documentElement.scrollHeight;
      const heightDiff = nextScrollHeight - previousScrollHeight;
      if (heightDiff > 0) {
        window.scrollBy({ top: heightDiff, behavior: "auto" });
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [messages]);

  useEffect(() => {
    if (isPrependingMessagesRef.current) {
      isPrependingMessagesRef.current = false;
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      messageEndRef.current?.scrollIntoView({
        block: "end",
        behavior: "auto",
      });
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "auto",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [messages.length]);

  useEffect(() => {
    if (!nextMessagesCursor || isLoadingMessages || isLoadingMoreMessages) {
      return;
    }

    const handleScroll = () => {
      if (window.scrollY > 120) return;
      if (isLoadingMoreMessages) return;

      const currentCursor = nextMessagesCursor;
      if (!currentCursor) return;

      isPrependingMessagesRef.current = true;
      prependScrollHeightRef.current = document.documentElement.scrollHeight;
      setIsLoadingMoreMessages(true);

      void getChatMessages(roomId, 20, currentCursor)
        .then((response) => {
          setMessages((prev) =>
            sortChatMessagesAsc(
              [
                ...response.messages
                  .map((item) => toUiMessage(item, currentMember?.id))
                  .filter(isChatMessage),
                ...prev,
              ].filter(
                (message, index, array) =>
                  array.findIndex((item) => item.id === message.id) === index,
              ),
            ),
          );
          setNextMessagesCursor(response.nextCursor);
        })
        .catch((error) => {
          isPrependingMessagesRef.current = false;
          prependScrollHeightRef.current = null;
          window.alert(
            error instanceof Error
              ? error.message
              : "이전 메시지를 불러오지 못했습니다.",
          );
        })
        .finally(() => {
          setIsLoadingMoreMessages(false);
        });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [
    currentMember?.id,
    isLoadingMessages,
    isLoadingMoreMessages,
    nextMessagesCursor,
    roomId,
  ]);

  useEffect(() => {
    if (socketStatus !== "connected") return;

    const intervalId = window.setInterval(() => {
      const lastReadMessageId = getLastReadableMessageId(messages);
      if (!lastReadMessageId) return;

      if (process.env.NODE_ENV !== "production") {
        console.log("[chat:read-state] heartbeat publish", {
          destination: CHAT_READ_STATE_SEND_DESTINATION,
          body: {
            roomId,
            lastReadMessageId,
          },
          messagesCount: messages.length,
        });
      }

      try {
        publish({
          destination: CHAT_READ_STATE_SEND_DESTINATION,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            roomId,
            lastReadMessageId,
          }),
        });
        markChatRoomReadOverride(roomId);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[chat:read-state] heartbeat publish failed", error);
        }
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [messages, publish, roomId, socketStatus]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[chat:room] messages snapshot", {
        roomId,
        totalMessages: messages.length,
        latestMessageId: getLastReadableMessageId(messages),
        messageIds: messages.map((message) => message.id),
      });
    }
  }, [messages, roomId]);

  const handleSendMessage = async () => {
    const trimmedMessage = messageInput.trim();
    if ((!trimmedMessage && !pendingImageFile) || isSendingMessage) return;
    if (socketStatus !== "connected") {
      window.alert(
        "채팅 연결이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.",
      );
      return;
    }

    const optimisticId = `temp-${Date.now()}`;
    const currentImagePreview = pendingImagePreview;
    const currentImageFile = pendingImageFile;
    setMessageInput("");
    setPendingImagePreview(null);
    setPendingImageFile(null);
    setIsSendingMessage(true);
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        messageId: null,
        direction: "right",
        message: trimmedMessage,
        imageUrl: currentImagePreview,
        createdAt: new Date().toISOString(),
        optimistic: true,
      },
    ]);

    try {
      let imageObjectKey: string | undefined;

      if (currentImageFile) {
        const [presigned] = await requestUploadPresign("POST", [
          currentImageFile.name.split(".").pop()?.toLowerCase() || "webp",
        ]);
        await uploadToPresignedUrl(
          presigned.uploadUrl,
          currentImageFile,
          currentImageFile.type || undefined,
        );
        imageObjectKey = presigned.imageObjectKey.replace(/^\/+/, "");
      }

      const payload = imageObjectKey
        ? { imageObjectKey }
        : trimmedMessage
          ? { message: trimmedMessage }
          : null;

      if (!payload) {
        throw new Error("텍스트 또는 이미지 중 하나는 포함해야 합니다.");
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("[chat:send] publish", {
          destination: CHAT_MESSAGE_SEND_DESTINATION,
          body: {
            roomId,
            message: payload.message ?? "",
            imageObjectKey: payload.imageObjectKey ?? null,
          },
        });
      }

      publish({
        destination: CHAT_MESSAGE_SEND_DESTINATION,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          message: payload.message ?? "",
          imageObjectKey: payload.imageObjectKey ?? null,
        }),
      });
    } catch (error) {
      setMessages((prev) => prev.filter((item) => item.id !== optimisticId));
      setMessageInput(trimmedMessage);
      setPendingImagePreview(currentImagePreview);
      setPendingImageFile(currentImageFile);
      window.alert(
        error instanceof Error
          ? error.message
          : "메시지 전송 중 오류가 발생했습니다.",
      );
    } finally {
      if (currentImagePreview?.startsWith("blob:")) {
        window.setTimeout(() => {
          URL.revokeObjectURL(currentImagePreview);
        }, 30_000);
      }
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed left-1/2 top-0 z-20 w-full max-w-[430px] -translate-x-1/2 border-b border-[#202020] bg-white">
        <div className="flex items-center gap-4 px-5 pb-4 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="뒤로 가기"
            className="flex h-10 w-10 shrink-0 items-center justify-center"
          >
            <Image src="/icons/back.svg" alt="" width={22} height={22} />
          </button>

          <div className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-full bg-[#dddddd]">
            <Image
              src={roomThumbnailSrc}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold tracking-[-0.03em] text-[#111111]">
              {roomTitle}
            </p>
            <div className="mt-2 flex items-center gap-1 text-[13px] font-medium text-[#111111]">
              <Image src="/icons/user.svg" alt="" width={14} height={14} />
              <span className="leading-none">{roomMemberCount}</span>
            </div>
          </div>

          <div ref={menuAreaRef} className="relative shrink-0">
            <button
              type="button"
              aria-label="채팅방 메뉴"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center"
            >
              <Image src="/icons/more.svg" alt="" width={18} height={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[42px] z-30 min-w-[88px] rounded-[14px] border border-[#d9d9d9] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
                {resolvedIsOwner ? (
                  <div className="flex flex-col gap-0.4">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setEditTitle(roomTitle);
                        setEditThumbnailPreview(roomThumbnailSrc);
                        setEditThumbnailFile(null);
                        setEditSelectedDefaultThumbnail(null);
                        setEditOpen(true);
                      }}
                      className="flex w-full items-center justify-center  border border-[#111111] bg-white px-3 py-2 text-[12px] font-medium text-[#111111]"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setDeleteConfirmOpen(true);
                      }}
                      className="flex w-full items-center justify-center  border border-[#ff4d4f] bg-[#fff1f1] px-3 py-2 text-[12px] font-medium text-[#ff4d4f] transition-colors hover:bg-[#ffe4e4]"
                    >
                      삭제
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setLeaveConfirmOpen(true);
                    }}
                    className="flex w-full items-center justify-center rounded-[10px] border border-[#ff4d4f] bg-[#fff1f1] px-3 py-2 text-[12px] font-medium text-[#ff4d4f] transition-colors hover:bg-[#ffe4e4]"
                  >
                    나가기
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="px-6 pb-[calc(env(safe-area-inset-bottom)+132px)] pt-[126px]">
        <div className="space-y-4">
          {isLoadingMoreMessages && (
            <div className="rounded-[20px] bg-[#f7f7f7] px-5 py-3 text-center text-[13px] text-[#888888]">
              이전 메시지를 불러오는 중입니다.
            </div>
          )}
          {isLoadingMessages && (
            <div className="rounded-[20px] bg-[#f7f7f7] px-5 py-4 text-[14px] text-[#888888]">
              메시지를 불러오는 중입니다.
            </div>
          )}
          {messagesError && !isLoadingMessages && (
            <div className="rounded-[20px] bg-[#fff4f4] px-5 py-4 text-[14px] text-[#cc4c4c]">
              {messagesError}
            </div>
          )}
          {messages.map((message) => (
            <ChatBubble
              key={`${roomId}-${message.id}`}
              direction={message.direction}
              senderNickname={message.senderNickname}
              senderProfileImageUrl={message.senderProfileImageUrl}
              message={message.message}
              imageUrl={message.imageUrl}
              createdAt={message.createdAt}
              unreadCount={
                message.messageId ? unreadCountByMessageId[message.messageId] : null
              }
              onImageClick={setExpandedImageUrl}
            />
          ))}
          <div ref={messageEndRef} />
        </div>
      </main>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-3">
        {pendingImagePreview ? (
          <div className="mb-3 flex items-start justify-between rounded-[24px] border border-[#d8d8d8] bg-[#f8f8f8] px-4 py-4">
            <div className="relative h-[74px] w-[74px] overflow-hidden rounded-[18px] bg-[#e7e7e7]">
              <Image
                src={pendingImagePreview}
                alt=""
                fill
                sizes="74px"
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (pendingImagePreview?.startsWith("blob:")) {
                  URL.revokeObjectURL(pendingImagePreview);
                }
                setPendingImagePreview(null);
                setPendingImageFile(null);
              }}
              className="flex h-8 w-8 items-center justify-center text-[#777777]"
              aria-label="선택한 이미지 제거"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : null}
        <div className="flex h-[72px] items-center gap-3 rounded-[30px] border border-[#c5c5c5] bg-white px-5">
          <button
            type="button"
            onClick={() => messageImageInputRef.current?.click()}
            disabled={isSendingMessage || Boolean(messageInput.trim())}
            aria-label="이미지 선택"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d2d2d2] text-[#666666] disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="4" y="5" width="16" height="14" rx="3" />
              <circle cx="9" cy="10" r="1.5" />
              <path
                d="M6.5 16l4-4 3 3 2-2 2 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <input
            ref={messageInputRef}
            type="text"
            value={messageInput}
            onChange={(event) => {
              if (pendingImageFile) return;
              setMessageInput(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.nativeEvent.isComposing)
                return;
              event.preventDefault();
              void handleSendMessage();
            }}
            disabled={isSendingMessage}
            readOnly={Boolean(pendingImageFile)}
            placeholder={
              pendingImageFile
                ? "사진을 전송하려면 Enter를 눌러주세요."
                : "메세지 보내기.."
            }
            className="w-full bg-transparent text-[14px] text-[#111111] outline-none placeholder:text-[#bdbdbd]"
          />
          <button
            type="button"
            onClick={() => void handleSendMessage()}
            disabled={
              (!messageInput.trim() && !pendingImageFile) || isSendingMessage
            }
            aria-label="메시지 전송"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white disabled:bg-[#d2d2d2]"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h12" strokeLinecap="round" />
              <path
                d="M13 6l6 6-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <input
          ref={messageImageInputRef}
          type="file"
          accept="image/*"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              const processed = await processImageFile(file, {
                maxLongSide: 1600,
                quality: 0.92,
                outputType: "image/webp",
              });

              setMessageInput("");
              if (pendingImagePreview?.startsWith("blob:")) {
                URL.revokeObjectURL(pendingImagePreview);
              }

              const processedFile = new File(
                [processed.blob],
                file.name.replace(/\.[^.]+$/, `.${processed.extension}`),
                {
                  type: processed.contentType,
                },
              );
              const objectUrl = URL.createObjectURL(processedFile);
              setPendingImagePreview(objectUrl);
              setPendingImageFile(processedFile);
              window.requestAnimationFrame(() => {
                messageInputRef.current?.focus();
              });
            } catch (error) {
              window.alert(
                error instanceof Error
                  ? error.message
                  : "이미지 처리 중 오류가 발생했습니다.",
              );
            } finally {
              event.target.value = "";
            }
          }}
          className="hidden"
        />
      </div>

      {leaveConfirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-[320px] rounded-[28px] bg-white px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <p className="text-center text-[19px] font-semibold tracking-[-0.03em] text-[#111111]">
              채팅방에서 나가시겠어요?
            </p>
            <p className="mt-3 text-center text-[14px] leading-6 text-[#6a6a6a]">
              나가기를 선택하면 현재 채팅방 목록에서 사라집니다.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isLeavingRoom) return;
                  setLeaveConfirmOpen(false);
                }}
                className="h-12 rounded-[16px] border border-[#d5d5d5] text-[15px] font-medium text-[#111111]"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isLeavingRoom}
                onClick={async () => {
                  try {
                    setIsLeavingRoom(true);
                    await leaveChatRoom(roomId);
                    router.replace("/chat");
                  } catch (error) {
                    window.alert(
                      error instanceof Error
                        ? error.message
                        : "채팅방 나가기 중 오류가 발생했습니다.",
                    );
                  } finally {
                    setIsLeavingRoom(false);
                    setLeaveConfirmOpen(false);
                  }
                }}
                className="h-12 rounded-[16px] bg-[#ff4d4f] text-[15px] font-medium text-white disabled:bg-[#ffb3b4]"
              >
                {isLeavingRoom ? "나가는 중..." : "나가기"}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateChatRoomModal
        open={editOpen}
        heading="채팅방 수정"
        title={editTitle}
        thumbnailPreview={editThumbnailPreview}
        defaultImages={DEFAULT_CHAT_ROOM_IMAGES}
        isSubmitting={isUpdatingRoom}
        confirmLabel="수정"
        confirmLoadingLabel="수정 중"
        canSubmit={canSubmitEdit}
        onTitleChange={setEditTitle}
        onUploadClick={() => editImageInputRef.current?.click()}
        onSelectDefaultImage={(image) => {
          if (editThumbnailPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(editThumbnailPreview);
          }
          setEditThumbnailPreview(image);
          setEditThumbnailFile(null);
          setEditSelectedDefaultThumbnail(image);
        }}
        onClose={() => {
          if (isUpdatingRoom) return;
          if (editThumbnailPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(editThumbnailPreview);
          }
          setEditTitle(roomTitle);
          setEditThumbnailPreview(roomThumbnailSrc);
          setEditThumbnailFile(null);
          setEditSelectedDefaultThumbnail(null);
          setEditOpen(false);
        }}
        onConfirm={async () => {
          let nextThumbnailImageObjectKey =
            roomThumbnailObjectKey || DEFAULT_CHAT_ROOM_THUMBNAIL_OBJECT_KEY;

          try {
            setIsUpdatingRoom(true);

            if (editThumbnailFile) {
              const extension =
                editThumbnailFile.name.split(".").pop()?.toLowerCase() || "png";
              const [presigned] = await requestUploadPresign("POST", [
                extension,
              ]);
              await uploadToPresignedUrl(
                presigned.uploadUrl,
                editThumbnailFile,
                editThumbnailFile.type || undefined,
              );
              nextThumbnailImageObjectKey = presigned.imageObjectKey.replace(
                /^\/+/,
                "",
              );
            } else if (editSelectedDefaultThumbnail) {
              const imageResponse = await fetch(editSelectedDefaultThumbnail);
              if (!imageResponse.ok) {
                throw new Error("기본 이미지를 불러오지 못했습니다.");
              }
              const imageBlob = await imageResponse.blob();
              const extension =
                editSelectedDefaultThumbnail.split(".").pop()?.toLowerCase() ||
                "png";
              const [presigned] = await requestUploadPresign("POST", [
                extension,
              ]);
              await uploadToPresignedUrl(
                presigned.uploadUrl,
                imageBlob,
                imageBlob.type || `image/${extension}`,
              );
              nextThumbnailImageObjectKey = presigned.imageObjectKey.replace(
                /^\/+/,
                "",
              );
            }

            await updateChatRoom(roomId, {
              title: editTitle.trim(),
              thumbnailImageObjectKey: nextThumbnailImageObjectKey,
            });
            setRoomTitle(editTitle.trim());
            setRoomThumbnailObjectKey(nextThumbnailImageObjectKey);
            setRoomThumbnailSrc(
              resolveMediaUrl(nextThumbnailImageObjectKey) ??
                editThumbnailPreview ??
                "/images/chat_default.png",
            );
            setEditThumbnailFile(null);
            setEditSelectedDefaultThumbnail(null);
            setEditOpen(false);
          } catch (error) {
            window.alert(
              error instanceof Error
                ? error.message
                : "채팅방 수정 중 오류가 발생했습니다.",
            );
          } finally {
            setIsUpdatingRoom(false);
          }
        }}
      />
      <input
        ref={editImageInputRef}
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          if (editThumbnailPreview?.startsWith("blob:")) {
            URL.revokeObjectURL(editThumbnailPreview);
          }
          const objectUrl = URL.createObjectURL(file);
          setEditThumbnailPreview(objectUrl);
          setEditThumbnailFile(file);
          setEditSelectedDefaultThumbnail(null);
          event.target.value = "";
        }}
        className="hidden"
      />

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-[320px] rounded-[28px] bg-white px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <p className="text-center text-[19px] font-semibold tracking-[-0.03em] text-[#111111]">
              채팅방을 삭제하시겠어요?
            </p>
            <p className="mt-3 text-center text-[14px] leading-6 text-[#6a6a6a]">
              삭제하면 관련 참여/메시지가 함께 제거됩니다.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="h-12 rounded-[16px] border border-[#d5d5d5] text-[15px] font-medium text-[#111111]"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isDeletingRoom}
                onClick={async () => {
                  try {
                    setIsDeletingRoom(true);
                    await deleteChatRoom(roomId);
                    router.replace("/chat");
                  } catch (error) {
                    window.alert(
                      error instanceof Error
                        ? error.message
                        : "채팅방 삭제 중 오류가 발생했습니다.",
                    );
                  } finally {
                    setIsDeletingRoom(false);
                  }
                }}
                className="h-12 rounded-[16px] bg-[#ff4d4f] text-[15px] font-medium text-white disabled:bg-[#ffb3b4]"
              >
                {isDeletingRoom ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {expandedImageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 px-4"
          onClick={() => setExpandedImageUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="확대 이미지"
        >
          <div className="absolute right-5 top-5 flex items-center gap-2">
            <a
              href={expandedImageUrl}
              download
              onClick={(event) => event.stopPropagation()}
              className="flex h-11 items-center justify-center rounded-full bg-white px-4 text-[13px] font-semibold text-[#111111]"
            >
              저장
            </a>
            <button
              type="button"
              onClick={() => setExpandedImageUrl(null)}
              aria-label="확대 이미지 닫기"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div
            className="relative max-h-[72vh] w-full max-w-[560px]"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={expandedImageUrl}
              alt=""
              className="mx-auto max-h-[72vh] w-auto max-w-full rounded-[20px] object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
