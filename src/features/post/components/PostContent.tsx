"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import { useCommentCount } from "../hooks/useCommentCountStore";
import { getPostDetailViewerState } from "../api/getPostDetailViewerState";
import { useHomeFeedPostActions } from "@/src/features/home/hooks/useHomeFeedPostActions";
import type { GetHomePostsResponse } from "@/src/features/home/api/getHomePosts";
import {
  dismissBookmarkAddedToast,
  showBookmarkAddedToast,
} from "@/src/shared/lib/showBookmarkAddedToast";
import { useRouter } from "next/navigation";

type PostContentProps = {
  postId: string;
  content: string;
  likeCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  onLikeBurst?: () => void;
};

type HomeFeedInfiniteData = InfiniteData<GetHomePostsResponse, string | null>;

function pickHomeFeedPost(
  data: HomeFeedInfiniteData | undefined,
  postId: number,
) {
  if (!data) return null;

  for (const page of data.pages) {
    const found = (page.posts ?? []).find((post) => post.id === postId);
    if (found) return found;
  }

  return null;
}

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
  onLikeBurst,
}: PostContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { count: commentCount, set: setCommentCount } = useCommentCount();
  const { toggleLikeAsync, liking, toggleBookmarkAsync, bookmarking } =
    useHomeFeedPostActions();

  const numericPostId = Number(postId);
  const initialHomeFeedPost = useMemo(() => {
    if (!Number.isFinite(numericPostId)) return null;
    const snapshots = queryClient.getQueriesData<HomeFeedInfiniteData>({
      queryKey: ["home-feed"],
    });

    for (const [, data] of snapshots) {
      const found = pickHomeFeedPost(data, numericPostId);
      if (found) return found;
    }
    return null;
  }, [numericPostId, queryClient]);

  const [viewerLiked, setViewerLiked] = useState(
    initialHomeFeedPost?.isLiked ?? isLiked,
  );
  const [viewerBookmarked, setViewerBookmarked] = useState(
    initialHomeFeedPost?.isBookmarked ?? isBookmarked,
  );
  const [viewerLikeCount, setViewerLikeCount] = useState(
    Number(initialHomeFeedPost?.aggregate?.likeCount ?? likeCount),
  );
  const [hasInteracted, setHasInteracted] = useState(false);

  const initialViewerState = useMemo(
    () => ({
      isLiked: initialHomeFeedPost?.isLiked ?? isLiked,
      isBookmarked: initialHomeFeedPost?.isBookmarked ?? isBookmarked,
      likeCount:
        typeof initialHomeFeedPost?.aggregate?.likeCount === "number"
          ? initialHomeFeedPost.aggregate.likeCount
          : likeCount,
      commentCount:
        typeof initialHomeFeedPost?.aggregate?.commentCount === "number"
          ? initialHomeFeedPost.aggregate.commentCount
          : commentCount,
    }),
    [
      commentCount,
      initialHomeFeedPost?.aggregate?.commentCount,
      initialHomeFeedPost?.aggregate?.likeCount,
      initialHomeFeedPost?.isBookmarked,
      initialHomeFeedPost?.isLiked,
      isBookmarked,
      isLiked,
      likeCount,
    ],
  );

  const { data: viewerState } = useQuery({
    queryKey: ["post-viewer-state", postId],
    queryFn: () => getPostDetailViewerState(postId),
    initialData: initialViewerState,
    // seed는 첫 paint에만 사용하고, 진입 시점마다 최신 viewer 상태를 재검증합니다.
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    enabled: Boolean(postId),
  });

  useEffect(() => {
    if (typeof viewerState?.commentCount === "number") {
      setCommentCount(viewerState.commentCount);
    }
  }, [setCommentCount, viewerState?.commentCount]);

  const liked = hasInteracted
    ? viewerLiked
    : (viewerState?.isLiked ?? viewerLiked);
  const likes = hasInteracted
    ? Number(viewerLikeCount)
    : Number(viewerState?.likeCount ?? viewerLikeCount);
  const bookmarked = hasInteracted
    ? viewerBookmarked
    : (viewerState?.isBookmarked ?? viewerBookmarked);

  const formatCount = (value: number) => {
    if (value < 1000) return String(value);
    const formatted = (value / 1000).toFixed(1);
    return `${formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted}k`;
  };

  const handleToggleLike = async () => {
    if (liking) return;

    if (!Number.isFinite(numericPostId)) return;

    setHasInteracted(true);
    const prevLiked = liked;
    const prevLikes = likes;
    const nextLiked = !prevLiked;

    if (nextLiked) onLikeBurst?.();
    setViewerLiked(nextLiked);
    setViewerLikeCount(Math.max(0, prevLikes + (nextLiked ? 1 : -1)));

    try {
      const result = await toggleLikeAsync({
        postId: numericPostId,
        nextLiked,
      });
      if (typeof result.likeCount === "number") {
        setViewerLikeCount(result.likeCount);
      }
      setViewerLiked(result.nextLiked);
    } catch {
      setViewerLiked(prevLiked);
      setViewerLikeCount(prevLikes);
    }
  };

  const handleToggleBookmark = async () => {
    if (bookmarking) return;
    if (!Number.isFinite(numericPostId)) return;

    setHasInteracted(true);
    const prevBookmarked = bookmarked;
    const nextBookmarked = !prevBookmarked;

    setViewerBookmarked(nextBookmarked);
    if (nextBookmarked) {
      showBookmarkAddedToast({
        onView: () => router.push("/profile?tab=bookmarks"),
      });
    } else {
      dismissBookmarkAddedToast();
    }

    try {
      const result = await toggleBookmarkAsync({
        postId: numericPostId,
        nextBookmarked,
      });
      setViewerBookmarked(result.nextBookmarked);
      if (!result.nextBookmarked) {
        dismissBookmarkAddedToast();
      }
    } catch {
      dismissBookmarkAddedToast();
      setViewerBookmarked(prevBookmarked);
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
              className={`h-[25px] w-[25px] ${liked ? "opacity-100" : "opacity-60"}`}
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
