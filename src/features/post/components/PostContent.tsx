"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { likePost } from "../api/likePost";
import { unlikePost } from "../api/unlikePost";

type PostContentProps = {
  postId: string;
  content: string;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean; // (추후 API 대비)
  onLikedChange?: (nextLiked: boolean) => void;
};

export default function PostContent({
  postId,
  content,
  likeCount,
  commentCount,
  isLiked = false,
  onLikedChange,
}: PostContentProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);
  const [liking, setLiking] = useState(false);
  const lastLikeCountRef = useRef(likeCount);

  useEffect(() => {
    setLiked(isLiked);
    if (lastLikeCountRef.current !== likeCount) {
      setLikes(likeCount);
      lastLikeCountRef.current = likeCount;
    }
  }, [isLiked, likeCount]);

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
          alert(nextLiked ? "좋아요에 실패했습니다." : "좋아요 해제에 실패했습니다.");
      }
    } finally {
      setLiking(false);
    }
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
          disabled={liking}
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
