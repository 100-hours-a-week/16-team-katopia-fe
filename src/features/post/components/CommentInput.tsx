"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";

interface Props {
  onSubmit: (content: string) => void;
}

export default function CommentInput({ onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !isComposing) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mt-2 flex items-center gap-3 rounded border px-3 py-3">
      <input
        placeholder="댓글을 입력하세요..."
        className="flex-1 text-[13px] outline-none"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
      />
      <button type="button" onClick={handleSubmit} aria-label="댓글 전송">
        <Image src="/icons/send.svg" alt="전송" width={20} height={20} />
      </button>
    </div>
  );
}
