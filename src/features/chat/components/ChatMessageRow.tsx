"use client";

import { memo } from "react";

import ChatBubble from "@/src/features/chat/components/ChatBubble";
import type { ChatMessage } from "@/src/features/chat/utils/chatMessageUtils";

type ChatMessageRowProps = {
  message: ChatMessage;
  unreadCount: number | null;
  onImageClick: (imageUrl: string) => void;
};

function ChatMessageRow({
  message,
  unreadCount,
  onImageClick,
}: ChatMessageRowProps) {
  return (
    <ChatBubble
      direction={message.direction}
      senderNickname={message.senderNickname}
      senderProfileImageUrl={message.senderProfileImageUrl}
      message={message.message}
      imageUrl={message.imageUrl}
      createdAt={message.createdAt}
      unreadCount={unreadCount}
      onImageClick={onImageClick}
    />
  );
}

function areEqualChatMessageRowProps(
  prevProps: ChatMessageRowProps,
  nextProps: ChatMessageRowProps,
) {
  return (
    prevProps.message === nextProps.message &&
    prevProps.unreadCount === nextProps.unreadCount &&
    prevProps.onImageClick === nextProps.onImageClick
  );
}

const MemoizedChatMessageRow = memo(
  ChatMessageRow,
  areEqualChatMessageRowProps,
);

MemoizedChatMessageRow.displayName = "ChatMessageRow";

export default MemoizedChatMessageRow;
