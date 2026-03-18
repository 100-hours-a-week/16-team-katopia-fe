"use client";

import type { RefObject } from "react";

import ChatBubble from "@/src/features/chat/components/ChatBubble";
import type { ChatMessage } from "@/src/features/chat/utils/chatMessageUtils";

type ChatMessageListProps = {
  roomId: string;
  messages: ChatMessage[];
  unreadCountByMessageId: Record<number, number>;
  isLoadingMessages: boolean;
  isLoadingMoreMessages: boolean;
  messagesError: string | null;
  messageEndRef: RefObject<HTMLDivElement | null>;
  onImageClick: (imageUrl: string) => void;
};

export default function ChatMessageList({
  roomId,
  messages,
  unreadCountByMessageId,
  isLoadingMessages,
  isLoadingMoreMessages,
  messagesError,
  messageEndRef,
  onImageClick,
}: ChatMessageListProps) {
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
    <div className="space-y-4">
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
          onImageClick={onImageClick}
        />
      ))}
      <div ref={messageEndRef} />
    </div>
  );
}
