"use client";

import Image from "next/image";
import { useCallback, useRef, useState, type KeyboardEvent } from "react";

interface Props {
  onSubmit: (content: string) => void;
}

export default function CommentInput({ onSubmit }: Props) {
  const MAX_COMMENT_LENGTH = 200;
  const [isComposing, setIsComposing] = useState(false);
  const [overLimit, setOverLimit] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = useCallback((el: HTMLTextAreaElement) => {
    const computed = window.getComputedStyle(el);
    const lineHeight = Number.parseFloat(computed.lineHeight || "0");
    const paddingTop = Number.parseFloat(computed.paddingTop || "0");
    const paddingBottom = Number.parseFloat(computed.paddingBottom || "0");
    const maxHeight = lineHeight
      ? lineHeight * 5 + paddingTop + paddingBottom
      : undefined;
    el.style.height = "auto";
    const nextHeight = el.scrollHeight;
    if (maxHeight && nextHeight > maxHeight) {
      el.style.height = `${maxHeight}px`;
      el.style.overflowY = "auto";
    } else {
      el.style.height = `${nextHeight}px`;
      el.style.overflowY = "hidden";
    }
  }, []);

  const handleSubmit = () => {
    const el = textareaRef.current;
    if (!el) return;
    const trimmed = el.value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setOverLimit(false);
    el.value = "";
    resizeTextarea(el);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !isComposing) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = useCallback(
    (event: React.FormEvent<HTMLTextAreaElement>) => {
      const el = event.currentTarget;
      if (el.value.length > MAX_COMMENT_LENGTH) {
        el.value = el.value.slice(0, MAX_COMMENT_LENGTH);
        setOverLimit(true);
      } else if (overLimit) {
        setOverLimit(false);
      }
      resizeTextarea(el);
    },
    [MAX_COMMENT_LENGTH, overLimit, resizeTextarea],
  );

  return (
    <div
      className={`mt-2 flex items-center gap-3 rounded border px-3 py-3 transition-colors ${
        overLimit
          ? "border-red-500 focus-within:border-red-500"
          : "border-gray-300 focus-within:border-black"
      }`}
    >
      <textarea
        placeholder="댓글을 입력하세요..."
        className="flex-1 resize-none text-[13px] outline-none"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        rows={1}
        ref={textareaRef}
      />
      <button type="button" onClick={handleSubmit} aria-label="댓글 전송">
        <Image src="/icons/send.svg" alt="전송" width={20} height={20} />
      </button>
    </div>
  );
}
