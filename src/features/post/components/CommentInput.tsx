"use client";

import Image from "next/image";
import { useState, type KeyboardEvent } from "react";

// 여기도 지금 충분히 댓글 입력할 때 리렌더링 줄여볼 수 있을 것 같거든? 그렇게 막 오바는 아닌데
// 댓글 입력할 때 마다 계속 리렌더링 돼.

interface Props {
  onSubmit: (content: string) => void;
}

export default function CommentInput({ onSubmit }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
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
      />
      <button type="button" onClick={handleSubmit} aria-label="댓글 전송">
        <Image src="/icons/send.svg" alt="전송" width={20} height={20} />
      </button>
    </div>
  );
}
