"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useHomeFeedPostActions } from "@/src/features/home/hooks/useHomeFeedPostActions";
import { saveHomeScrollPosition } from "../utils/homeScrollPosition";
import {
  dismissBookmarkAddedToast,
  showBookmarkAddedToast,
} from "@/src/shared/lib/showBookmarkAddedToast";

type HomePostActionsProps = {
  postId: number;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  onLikeBurst?: () => void;
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
  onLikeBurst,
}: HomePostActionsProps) {
  const router = useRouter();
  const { toggleLike, liking, toggleBookmarkAsync, bookmarking } =
    useHomeFeedPostActions();

  const liked = isLiked;
  const likes = likeCount;
  const bookmarked = isBookmarked;

  const formatCount = (value: number) => {
    if (value < 1000) return String(value);
    const formatted = (value / 1000).toFixed(1);
    return `${formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted}k`;
  };

  const handleToggleLike = () => {
    if (liking) return;
    const nextLiked = !liked;
    if (nextLiked) onLikeBurst?.();
    toggleLike({ postId, nextLiked });
  };

  const handleToggleBookmark = async () => {
    if (bookmarking) return;
    const nextBookmarked = !bookmarked;
    if (nextBookmarked) {
      showBookmarkAddedToast({
        onView: () => router.push("/profile?tab=bookmarks"),
      });
    } else {
      dismissBookmarkAddedToast();
    }
    try {
      const result = await toggleBookmarkAsync({
        postId,
        nextBookmarked,
      });
      if (!result.nextBookmarked) {
        dismissBookmarkAddedToast();
      }
    } catch {
      dismissBookmarkAddedToast();
      // mutation onError handles user-facing failure messaging
    }
  };

  const handleOpenPostDetail = () => {
    saveHomeScrollPosition();
    router.push(`/post/${postId}?from=home`);
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
          onClick={handleOpenPostDetail}
          className="flex items-center gap-2 text-neutral-900"
          aria-label="댓글"
        >
          <Image src="/icons/comment.svg" alt="" width={22} height={22} />
          <span className="text-[14px] font-semibold">
            {formatCount(commentCount)}
          </span>
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
