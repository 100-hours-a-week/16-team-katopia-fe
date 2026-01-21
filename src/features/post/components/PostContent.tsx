import { useState } from "react";
import Image from "next/image";
import { MOCK_FEED } from "../data/mockFeed";

interface Props {
  commentCount: number;
}

export default function PostContent({ commentCount }: Props) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(MOCK_FEED.likes);

  const handleToggleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      setLikes((count) => count + (next ? 1 : -1));
      return next;
    });
  };

  return (
    <div className="mt-4 space-y-5">
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
      <p className="text-[13px]">{MOCK_FEED.content}</p>
    </div>
  );
}
