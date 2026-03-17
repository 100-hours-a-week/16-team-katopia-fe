"use client";

import Image from "next/image";
import type { ChangeEvent, RefObject } from "react";

type ChatInputProps = {
  messageInput: string;
  pendingImagePreview: string | null;
  pendingImageFile: File | null;
  isSendingMessage: boolean;
  messageInputRef: RefObject<HTMLInputElement | null>;
  messageImageInputRef: RefObject<HTMLInputElement | null>;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onRemovePendingImage: () => void;
  onSelectImage: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
};

export default function ChatInput({
  messageInput,
  pendingImagePreview,
  pendingImageFile,
  isSendingMessage,
  messageInputRef,
  messageImageInputRef,
  onMessageChange,
  onSend,
  onRemovePendingImage,
  onSelectImage,
}: ChatInputProps) {
  return (
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
            onClick={onRemovePendingImage}
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
            onMessageChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
            event.preventDefault();
            onSend();
          }}
          disabled={isSendingMessage}
          readOnly={Boolean(pendingImageFile)}
          placeholder={
            pendingImageFile ? "사진을 전송하려면 Enter를 눌러주세요." : "메세지 보내기.."
          }
          className="w-full bg-transparent text-[14px] text-[#111111] outline-none placeholder:text-[#bdbdbd]"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={(!messageInput.trim() && !pendingImageFile) || isSendingMessage}
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
        onChange={(event) => {
          void onSelectImage(event);
        }}
        className="hidden"
      />
    </div>
  );
}
