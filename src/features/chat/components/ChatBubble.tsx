"use client";

import { memo } from "react";
import Image from "next/image";

import { formatMessageTime } from "@/src/features/chat/utils/chatMessageUtils";

type ChatBubbleProps = {
  direction: "left" | "right";
  senderNickname?: string | null;
  senderProfileImageUrl?: string | null;
  message: string;
  imageUrl?: string | null;
  createdAt?: string;
  unreadCount?: number | null;
  onImageClick?: (imageUrl: string) => void;
};

function ChatBubble({
  direction,
  senderNickname,
  senderProfileImageUrl,
  message,
  imageUrl,
  createdAt,
  unreadCount,
  onImageClick,
}: ChatBubbleProps) {
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
              <div className="max-w-[280px] rounded-bl-[22px] rounded-br-[22px] rounded-tl-none rounded-tr-[22px] bg-[#f1f1f1] text-[14px] leading-6 text-[#111111]">
                {bubbleContent}
              </div>
              <div className="flex shrink-0 flex-col items-start px-1">
                {typeof unreadCount === "number" && unreadCount > 0 ? (
                  <span className="whitespace-nowrap text-[11px] font-medium text-[#121212]">
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
                <span className="whitespace-nowrap text-[11px] font-medium text-[#121212]">
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

const MemoizedChatBubble = memo(ChatBubble);
MemoizedChatBubble.displayName = "ChatBubble";
export default MemoizedChatBubble;
