"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { likePost } from "../api/likePost";
import { unlikePost } from "../api/unlikePost";
import { bookmarkPost } from "../api/bookmarkPost";
import { unbookmarkPost } from "../api/unbookmarkPost";
import { useCommentCount } from "../hooks/useCommentCountStore";

type PostContentProps = {
  postId: string;
  content: string;
  likeCount: number;
  isLiked?: boolean; // (추후 API 대비)
  isBookmarked?: boolean;
  onLikedChange?: (nextLiked: boolean) => void;
  onBookmarkedChange?: (nextBookmarked: boolean) => void;
};

function BookmarkIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7"
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

export default function PostContent({
  postId,
  content,
  likeCount,
  isLiked = false,
  isBookmarked = false,
  onLikedChange,
  onBookmarkedChange,
}: PostContentProps) {
  const { count: commentCount } = useCommentCount();
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

  const formatCount = (value: number) => {
    if (value < 1000) return String(value);
    const formatted = (value / 1000).toFixed(1);
    return `${formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted}k`;
  };

  const handleToggleLike = async () => {
    if (liking) return;
    setLiking(true);
    const prevLiked = liked;
    const prevLikes = likes;
    const nextLiked = !prevLiked;

    // 먼저 UI를 반응시키고, 실패 시 롤백합니다.
    setLiked(nextLiked);
    onLikedChange?.(nextLiked);
    setLikes((count) => Math.max(0, count + (nextLiked ? 1 : -1)));

    try {
      const result = nextLiked
        ? await likePost(postId)
        : await unlikePost(postId);
      if (typeof result.likeCount === "number") {
        setLikes(result.likeCount);
      }
      setLiked(nextLiked);
      onLikedChange?.(nextLiked);
    } catch (e: unknown) {
      const error = e as { code?: string; status?: number };

      // 서버가 "이미 좋아요한 상태"를 409로 주는 경우,
      // 토글 의도에 맞춰 해제 요청으로 한 번 더 시도합니다.
      if (nextLiked && error.status === 409) {
        try {
          const result = await unlikePost(postId);
          const resolvedLiked = false;
          if (typeof result.likeCount === "number") {
            setLikes(result.likeCount);
          } else {
            setLikes(Math.max(0, prevLikes - 1));
          }
          setLiked(resolvedLiked);
          onLikedChange?.(resolvedLiked);
          return;
        } catch {
          // 해제까지 실패하면 아래 롤백/에러 처리로 진행
        }
      }

      // 실패 시 이전 상태로 되돌립니다.
      setLiked(prevLiked);
      setLikes(prevLikes);
      onLikedChange?.(prevLiked);

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
    onBookmarkedChange?.(nextBookmarked);

    try {
      const result = nextBookmarked
        ? await bookmarkPost(postId)
        : await unbookmarkPost(postId);
      if (typeof result.isBookmarked === "boolean") {
        setBookmarked(result.isBookmarked);
        onBookmarkedChange?.(result.isBookmarked);
      }
    } catch (e: unknown) {
      const error = e as { code?: string; status?: number };
      setBookmarked(prevBookmarked);
      onBookmarkedChange?.(prevBookmarked);

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
    <div className="mt-4 space-y-5">
      {/* 좋아요 / 댓글 */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleToggleLike}
            className="flex items-center gap-1.5"
            aria-pressed={liked}
            disabled={liking}
          >
            <Image
              src={liked ? "/icons/heart_on.svg" : "/icons/heart.svg"}
              alt="좋아요"
              width={25}
              height={25}
              className={liked ? "opacity-100" : "opacity-60"}
              style={{ width: "auto", height: "auto" }}
            />
            <span className="text-[12px]">{likes}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <Image src="/icons/comment.svg" alt="댓글" width={25} height={25} />
            <span className="text-[12px]">{formatCount(commentCount)}</span>
          </div>
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

      {/* 본문 */}
      <p className="text-[13px] whitespace-pre-line">{content}</p>
    </div>
  );
}
