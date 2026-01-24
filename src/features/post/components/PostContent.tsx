"use client";

import { useState } from "react";
import Image from "next/image";

type PostContentProps = {
  content: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean; // (추후 API 대비)
};

export default function PostContent({
  content,
  likeCount,
  commentCount,
  isLiked = false,
}: PostContentProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);

  const handleToggleLike = () => {
    // 🔥 지금은 UI 토글만
    // 다음 단계에서 API 연동
    setLiked((prev) => {
      const next = !prev;
      setLikes((count) => count + (next ? 1 : -1));
      return next;
    });
  };

  return (
    <div className="mt-4 space-y-5">
      {/* 좋아요 / 댓글 */}
      <div className="flex items-center gap-4 text-sm">
        <button
          type="button"
          onClick={handleToggleLike}
          className="flex items-center gap-1.5"
          aria-pressed={liked}
        >
          <Image
            src={liked ? "/icons/heart_on.svg" : "/icons/heart.svg"}
            alt="좋아요"
            width={25}
            height={25}
            className={liked ? "opacity-100" : "opacity-60"}
          />
          <span className="text-[12px]">{likes}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <Image src="/icons/comment.svg" alt="댓글" width={25} height={25} />
          <span className="text-[12px]">{commentCount}</span>
        </div>
      </div>

      {/* 본문 */}
      <p className="text-[13px] whitespace-pre-line">{content}</p>
    </div>
  );
}
