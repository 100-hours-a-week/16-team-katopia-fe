"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { likePost } from "@/src/features/post/api/likePost";
import { unlikePost } from "@/src/features/post/api/unlikePost";
import { bookmarkPost } from "@/src/features/post/api/bookmarkPost";
import { unbookmarkPost } from "@/src/features/post/api/unbookmarkPost";

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
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);
  const [liking, setLiking] = useState(false);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [bookmarking, setBookmarking] = useState(false);
  const lastLikeCountRef = useRef(likeCount);

  useEffect(() => {
    setLiked(isLiked);
    setBookmarked(isBookmarked);
    if (lastLikeCountRef.current !== likeCount) {
      setLikes(likeCount);
      lastLikeCountRef.current = likeCount;
    }
  }, [isLiked, isBookmarked, likeCount]);

  const handleToggleLike = async () => {
    if (liking) return;
    setLiking(true);

    const prevLiked = liked;
    const prevLikes = likes;
    const nextLiked = !prevLiked;

    setLiked(nextLiked);
    setLikes((count) => Math.max(0, count + (nextLiked ? 1 : -1)));

    try {
      const result = nextLiked
        ? await likePost(String(postId))
        : await unlikePost(String(postId));
      if (typeof result.likeCount === "number") {
        setLikes(result.likeCount);
      }
      setLiked(nextLiked);
    } catch (e: unknown) {
      const error = e as { code?: string; status?: number };

      if (nextLiked && error.status === 409) {
        try {
          const result = await unlikePost(String(postId));
          const resolvedLiked = false;
          if (typeof result.likeCount === "number") {
            setLikes(result.likeCount);
          } else {
            setLikes(Math.max(0, prevLikes - 1));
          }
          setLiked(resolvedLiked);
          return;
        } catch {
          // fall through
        }
      }

      setLiked(prevLiked);
      setLikes(prevLikes);

      switch (error.code) {
        case "AUTH-E-002":
          alert("로그인이 필요합니다.");
          break;
        case "POST-E-005":
          alert("게시글을 찾을 수 없습니다.");
          break;
        default:
          alert(
            nextLiked
              ? "좋아요에 실패했습니다."
              : "좋아요 해제에 실패했습니다.",
          );
      }
    } finally {
      setLiking(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (bookmarking) return;
    setBookmarking(true);

    const prevBookmarked = bookmarked;
    const nextBookmarked = !prevBookmarked;

    setBookmarked(nextBookmarked);

    try {
      const result = nextBookmarked
        ? await bookmarkPost(String(postId))
        : await unbookmarkPost(String(postId));
      if (typeof result.isBookmarked === "boolean") {
        setBookmarked(result.isBookmarked);
      }
    } catch (e: unknown) {
      const error = e as { code?: string; status?: number };
      setBookmarked(prevBookmarked);

      switch (error.code) {
        case "AUTH-E-002":
          alert("로그인이 필요합니다.");
          break;
        case "POST-E-005":
          alert("게시글을 찾을 수 없습니다.");
          break;
        default:
          alert(
            nextBookmarked
              ? "북마크에 실패했습니다."
              : "북마크 해제에 실패했습니다.",
          );
      }
    } finally {
      setBookmarking(false);
    }
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
            className={liked ? "opacity-100" : "opacity-60"}
          />
          <span className="text-[14px] font-semibold">{likes}</span>
        </button>
        <button
          type="button"
          onClick={() => router.push(`/post/${postId}`)}
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
