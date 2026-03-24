"use client";

import { memo, useEffect } from "react";
import type { RefObject } from "react";

import ChatMessageRow from "@/src/features/chat/components/ChatMessageRow";
import type { ChatMessage } from "@/src/features/chat/utils/chatMessageUtils";

type ChatMessageListProps = {
  roomId: string;
  messages: ChatMessage[];
  unreadCountByMessageId: Record<number, number>;
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  messagesError: string | null;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  topSentinelRef: RefObject<HTMLDivElement | null>;
  messageEndRef: RefObject<HTMLDivElement | null>;
  onLoadPreviousMessages: () => void;
  onImageClick: (imageUrl: string) => void;
};

function ChatMessageList({
  roomId,
  messages,
  unreadCountByMessageId,
  isLoadingMessages,
  isLoadingMoreMessages,
  messagesError,
  scrollContainerRef,
  topSentinelRef,
  messageEndRef,
  onLoadPreviousMessages,
  onImageClick,
}: ChatMessageListProps) {
  useEffect(() => {
    const container = scrollContainerRef.current;
    const target = topSentinelRef.current;
    if (!container || !target || !onLoadPreviousMessages) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        onLoadPreviousMessages();
      },
      {
        root: container,
        threshold: 0,
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [onLoadPreviousMessages, scrollContainerRef, topSentinelRef]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (isLoadingMessages || isLoadingMoreMessages) return;
    if (container.scrollTop > 50) return;

    onLoadPreviousMessages();
  }, [
    isLoadingMessages,
    isLoadingMoreMessages,
    messages.length,
    onLoadPreviousMessages,
    scrollContainerRef,
  ]);

  const loadingSkeleton = (
    <div className="space-y-5 px-1">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[#ececec]" />
        <div className="min-w-0 space-y-2">
          <div className="h-3 w-16 animate-pulse rounded-full bg-[#f1f1f1]" />
          <div className="h-[52px] w-[148px] animate-pulse rounded-bl-[22px] rounded-br-[22px] rounded-tl-none rounded-tr-[22px] bg-[#f3f3f3]" />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="space-y-2">
          <div className="ml-auto h-[44px] w-[132px] animate-pulse rounded-bl-[22px] rounded-br-[22px] rounded-tl-[22px] rounded-tr-none bg-[#e3e3e3]" />
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[#ececec]" />
        <div className="min-w-0 space-y-2">
          <div className="h-3 w-14 animate-pulse rounded-full bg-[#f1f1f1]" />
          <div className="h-[68px] w-[186px] animate-pulse rounded-bl-[22px] rounded-br-[22px] rounded-tl-none rounded-tr-[22px] bg-[#f3f3f3]" />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="space-y-2">
          <div className="ml-auto h-[52px] w-[168px] animate-pulse rounded-bl-[22px] rounded-br-[22px] rounded-tl-[22px] rounded-tr-none bg-[#e3e3e3]" />
        </div>
      </div>
    </div>
  );

  return (
    <section className="space-y-4">
      <div ref={topSentinelRef} className="h-px w-full" />
      {isLoadingMoreMessages && (
        <div className="rounded-[20px] bg-[#f7f7f7] px-5 py-3 text-center text-[13px] text-[#888888]">
          이전 메시지를 불러오는 중입니다.
        </div>
      )}
      {isLoadingMessages && loadingSkeleton}
      {messagesError && !isLoadingMessages && (
        <div className="rounded-[20px] bg-[#fff4f4] px-5 py-4 text-[14px] text-[#cc4c4c]">
          {messagesError}
        </div>
      )}
      {!isLoadingMessages && !messagesError ? (
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessageRow
              key={`${roomId}-${message.id}`}
              message={message}
              unreadCount={
                message.messageId
                  ? unreadCountByMessageId[message.messageId]
                  : null
              }
              onImageClick={onImageClick}
            />
          ))}
          <div
            ref={messageEndRef}
            className="h-2.5 w-full"
            style={{ scrollMarginBottom: "120px" }}
          />
        </div>
      ) : (
        <div
          ref={messageEndRef}
          className="h-2.5 w-full"
          style={{ scrollMarginBottom: "120px" }}
        />
      )}
    </section>
  );
}

function areEqualChatMessageListProps(
  prevProps: ChatMessageListProps,
  nextProps: ChatMessageListProps,
) {
  return (
    prevProps.roomId === nextProps.roomId &&
    prevProps.messages === nextProps.messages &&
    prevProps.unreadCountByMessageId === nextProps.unreadCountByMessageId &&
    prevProps.isLoadingMessages === nextProps.isLoadingMessages &&
    prevProps.isLoadingMoreMessages === nextProps.isLoadingMoreMessages &&
    prevProps.messagesError === nextProps.messagesError &&
    prevProps.scrollContainerRef === nextProps.scrollContainerRef &&
    prevProps.topSentinelRef === nextProps.topSentinelRef &&
    prevProps.messageEndRef === nextProps.messageEndRef &&
    prevProps.onLoadPreviousMessages === nextProps.onLoadPreviousMessages &&
    prevProps.onImageClick === nextProps.onImageClick
  );
}

const MemoizedChatMessageList = memo(
  ChatMessageList,
  areEqualChatMessageListProps,
);

MemoizedChatMessageList.displayName = "ChatMessageList";

export default MemoizedChatMessageList;
