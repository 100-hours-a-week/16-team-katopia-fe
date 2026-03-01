"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useHomeFeedPostActions } from "@/src/features/home/hooks/useHomeFeedPostActions";

type HomePostActionsProps = {
  postId: number;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
};

function BookmarkIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M6 4.5h12a1 1 0 0 1 1 1v15l-7-4-7 4v-15a1 1 0 0 1 1-1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePostActions({
  postId,
  likeCount,
  commentCount,
  isLiked = false,
  isBookmarked = false,
}: HomePostActionsProps) {
  const router = useRouter();
  const { toggleLike, liking, toggleBookmark, bookmarking } =
    useHomeFeedPostActions();

  const liked = isLiked;
  const likes = likeCount;
  const bookmarked = isBookmarked;

  const handleToggleLike = () => {
    if (liking) return;
    toggleLike({ postId, nextLiked: !liked });
  };

  const handleToggleBookmark = () => {
    if (bookmarking) return;
    toggleBookmark({ postId, nextBookmarked: !bookmarked });
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={handleToggleLike}
          className="flex items-center gap-2 text-neutral-900"
          aria-label="좋아요"
          aria-pressed={liked}
          disabled={liking}
        >
          <Image
            src={liked ? "/icons/heart_on.svg" : "/icons/heart.svg"}
            alt=""
            width={22}
            height={22}
            className={`h-[22px] w-[22px] ${liked ? "opacity-100" : "opacity-60"}`}
          />
          <span className="text-[14px] font-semibold">{likes}</span>
        </button>
        <button
          type="button"
          onClick={() => router.push(`/post/${postId}?from=home`)}
          className="flex items-center gap-2 text-neutral-900"
          aria-label="댓글"
        >
          <Image src="/icons/comment.svg" alt="" width={22} height={22} />
          <span className="text-[14px] font-semibold">{commentCount}</span>
        </button>
      </div>
      <button
        type="button"
        aria-label="저장"
        className="text-neutral-900"
        onClick={handleToggleBookmark}
        aria-pressed={bookmarked}
        disabled={bookmarking}
      >
        <BookmarkIcon active={bookmarked} />
      </button>
    </div>
  );
}
