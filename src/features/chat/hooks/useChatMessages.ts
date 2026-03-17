"use client";

import type { IMessage, StompSubscription } from "@stomp/stompjs";
import { useEffect, useMemo, useRef, useState } from "react";

import { getChatMessages } from "@/src/features/chat/api/getChatMessages";
import { normalizeChatMessage } from "@/src/features/chat/utils/normalizeChatMessage";
import type { ChatMessage } from "@/src/features/chat/utils/chatMessageUtils";
import {
  buildUnreadCountByMessageId,
  getLastReadableMessageId,
  isChatMessage,
  reconcileIncomingMessage,
  sortChatMessagesAsc,
  toUiMessage,
} from "@/src/features/chat/utils/chatMessageUtils";
import {
  mergeReadStateParticipants,
  normalizeReadStateParticipants,
  type ReadStateParticipant,
} from "@/src/features/chat/utils/readStateUtils";
import { markChatRoomReadOverride } from "@/src/features/chat/utils/chatReadOverride";
import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";

const CHAT_MESSAGE_SUBSCRIPTION_ID = "sub-messages";
const CHAT_READ_STATE_SUBSCRIPTION_ID = "sub-read-state";
const CHAT_MESSAGE_SEND_DESTINATION = "/app/chat.message";
const CHAT_READ_STATE_SEND_DESTINATION = "/app/chat.read-state";

function buildChatRoomSubscribeDestination(roomId: string) {
  return `/topic/chat/rooms/${roomId}/messages`;
}

function buildChatRoomReadStateSubscribeDestination(roomId: string) {
  return `/topic/chat/rooms/${roomId}/read-state`;
}

type Params = {
  roomId: string;
  currentMemberId?: string | number | null;
  roomMemberCount: number;
  socketStatus: "idle" | "connecting" | "connected" | "error";
  subscribe: (
    destination: string,
    callback: (message: IMessage) => void,
    headers?: Record<string, string>,
  ) => StompSubscription | null;
  publish: ({
    destination,
    body,
    headers,
  }: {
    destination: string;
    body?: string;
    headers?: Record<string, string>;
  }) => void;
};

export function useChatMessages({
  roomId,
  currentMemberId,
  roomMemberCount,
  socketStatus,
  subscribe,
  publish,
}: Params) {
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
  const messageEndRef = useRef<HTMLDivElement>(null);
  const prependScrollHeightRef = useRef<number | null>(null);
  const isPrependingMessagesRef = useRef(false);

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

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        setMessagesError(null);
        const response = await getChatMessages(roomId);
        if (cancelled) return;

        setMessages(
          sortChatMessagesAsc(
            response.messages
              .map((item) => toUiMessage(item, currentMemberId))
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
  }, [currentMemberId, roomId]);

  useEffect(() => {
    if (socketStatus !== "connected") return;

    let messageSubscription: StompSubscription | null = null;
    let readStateSubscription: StompSubscription | null = null;
    const messageDestination = buildChatRoomSubscribeDestination(roomId);
    const readStateDestination =
      buildChatRoomReadStateSubscribeDestination(roomId);

    const handleMessage = (frame: IMessage) => {
      const rawBody = frame.body?.trim();
      if (!rawBody) return;

      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(rawBody);
      } catch {
        return;
      }

      const normalized = toUiMessage(
        normalizeChatMessage(parsedBody, roomId),
        currentMemberId,
      );
      if (!normalized) return;

      const isOwnMessage =
        String(normalized.senderId ?? "") === String(currentMemberId ?? "");

      setMessages((prev) =>
        reconcileIncomingMessage(prev, normalized, isOwnMessage),
      );
    };

    const handleReadState = (frame: IMessage) => {
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
    };

    messageSubscription = subscribe(messageDestination, handleMessage, {
      id: CHAT_MESSAGE_SUBSCRIPTION_ID,
    });
    readStateSubscription = subscribe(readStateDestination, handleReadState, {
      id: CHAT_READ_STATE_SUBSCRIPTION_ID,
    });

    return () => {
      messageSubscription?.unsubscribe();
      readStateSubscription?.unsubscribe();
    };
  }, [currentMemberId, roomId, socketStatus, subscribe]);

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
                  .map((item) => toUiMessage(item, currentMemberId))
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
    currentMemberId,
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
      } catch {
        // ignore
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [messages, publish, roomId, socketStatus]);

  const sendMessage = async ({
    messageInput,
    pendingImagePreview,
    pendingImageFile,
    onStart,
    onErrorRestore,
    onFinally,
  }: {
    messageInput: string;
    pendingImagePreview: string | null;
    pendingImageFile: File | null;
    onStart: () => void;
    onErrorRestore: () => void;
    onFinally: () => void;
  }) => {
    const trimmedMessage = messageInput.trim();
    if ((!trimmedMessage && !pendingImageFile) || socketStatus !== "connected") {
      if (socketStatus !== "connected") {
        window.alert(
          "채팅 연결이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.",
        );
      }
      return;
    }

    const optimisticId = `temp-${Date.now()}`;
    onStart();
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        messageId: null,
        direction: "right",
        message: trimmedMessage,
        imageUrl: pendingImagePreview,
        createdAt: new Date().toISOString(),
        optimistic: true,
      },
    ]);

    try {
      let imageObjectKey: string | undefined;

      if (pendingImageFile) {
        const [presigned] = await requestUploadPresign("POST", [
          pendingImageFile.name.split(".").pop()?.toLowerCase() || "webp",
        ]);
        await uploadToPresignedUrl(
          presigned.uploadUrl,
          pendingImageFile,
          pendingImageFile.type || undefined,
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
      onErrorRestore();
      window.alert(
        error instanceof Error
          ? error.message
          : "메시지 전송 중 오류가 발생했습니다.",
      );
    } finally {
      if (pendingImagePreview?.startsWith("blob:")) {
        window.setTimeout(() => {
          URL.revokeObjectURL(pendingImagePreview);
        }, 30_000);
      }
      onFinally();
    }
  };

  return {
    messages,
    unreadCountByMessageId,
    readStateParticipants,
    isLoadingMessages,
    isLoadingMoreMessages,
    messagesError,
    messageEndRef,
    sendMessage,
  };
}
