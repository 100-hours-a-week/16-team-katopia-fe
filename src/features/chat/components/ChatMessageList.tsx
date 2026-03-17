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
  return (
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
          onImageClick={onImageClick}
        />
      ))}
      <div ref={messageEndRef} />
    </div>
  );
}
