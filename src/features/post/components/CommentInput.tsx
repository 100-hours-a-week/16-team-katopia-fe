"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

interface Props {
  onSubmit: (content: string) => void;
}

export default function CommentInput({ onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
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
    <div className="mt-2 flex items-center gap-3 rounded border px-3 py-3 focus-within:border-black">
      <textarea
        placeholder="댓글을 입력하세요..."
        className="flex-1 resize-none text-[13px] outline-none"
        value={value}
        onChange={(event) => setValue(event.target.value)}
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
