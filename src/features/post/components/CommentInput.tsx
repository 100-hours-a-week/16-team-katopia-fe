"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

interface Props {
  onSubmit: (content: string) => void;
}

export default function CommentInput({ onSubmit }: Props) {
  const MAX_COMMENT_LENGTH = 200;
  const [value, setValue] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [overLimit, setOverLimit] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
    setOverLimit(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !isComposing) {
      event.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
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
  }, [value]);

  return (
    <div
      className={`mt-2 flex items-center gap-3 rounded border px-3 py-3 ${
        overLimit ? "border-red-500" : "border-black"
      }`}
    >
      <textarea
        placeholder="댓글을 입력하세요..."
        className="flex-1 resize-none text-[13px] outline-none"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (next.length <= MAX_COMMENT_LENGTH) {
            setValue(next);
            setOverLimit(false);
            return;
          } else {
            setValue(next.slice(0, MAX_COMMENT_LENGTH));
            setOverLimit(true);
          }
        }}
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
