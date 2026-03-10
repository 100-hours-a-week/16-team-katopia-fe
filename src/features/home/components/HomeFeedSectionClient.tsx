"use client";

import { useMemo } from "react";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import HomeFeed from "./HomeFeed";
import HomeFeedSkeleton from "./HomeFeedSkeleton";
import { useInfiniteHomeFeed } from "../hooks/useInfiniteHomeFeed";
import { useHomeScrollRestoration } from "../hooks/useHomeScrollRestoration";
import HomeVirtualFeed from "./HomeVirtualFeed";
import type { GetHomePostsResponse } from "../api/getHomePosts";
import type { HomePost } from "../hooks/useInfiniteHomeFeed";

type HomeFeedSectionClientProps = {
  size?: number;
  initialFeed?: GetHomePostsResponse | null;
};

const VIRTUALIZATION_START_COUNT = 30;
const OWN_POST_VISIBLE_WINDOW_MS = 24 * 60 * 60 * 1000;

function toTimestamp(createdAt?: string | null) {
  if (!createdAt) return null;
  const normalized = createdAt.endsWith("Z") ? createdAt : `${createdAt}Z`;
  const ms = new Date(normalized).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function filterOwnPostsByAge(
  posts: HomePost[],
  currentMemberId?: number | string,
) {
  if (currentMemberId == null) return posts;

  const now = Date.now();
  const myId = String(currentMemberId);

  return posts.filter((post) => {
    if (String(post.author.id) !== myId) return true;
    const createdAtMs = toTimestamp(post.createdAt);
    if (createdAtMs == null) return true;
    return now - createdAtMs <= OWN_POST_VISIBLE_WINDOW_MS;
  });
}

export default function HomeFeedSectionClient({
  size = 10,
  initialFeed = null,
}: HomeFeedSectionClientProps) {
  const { ready, isAuthenticated, currentMember } = useAuth();
  const hasInitialFeed = (initialFeed?.posts?.length ?? 0) > 0;
  // auth bootstrap 완료 전에도 피드 요청을 먼저 시작해 LCP 리소스 발견 시점을 앞당깁니다.
  const feedEnabled = !ready || isAuthenticated;

  const {
    items: posts,
    hasMore: postsHasMore,
    observe: observePosts,
    loading,
  } = useInfiniteHomeFeed({
    size,
    enabled: feedEnabled,
    initialData: hasInitialFeed ? initialFeed : null,
  });

  const visiblePosts = useMemo(
    () => filterOwnPostsByAge(posts, currentMember?.id),
    [currentMember?.id, posts],
  );

  const virtualizationEnabled =
    visiblePosts.length >= VIRTUALIZATION_START_COUNT;

  useHomeScrollRestoration(visiblePosts.length);

  if (!ready && posts.length === 0) {
    return <HomeFeedSkeleton />;
  }

  if (ready && !isAuthenticated) {
    return null;
  }

  if (loading && posts.length === 0) {
    return <HomeFeedSkeleton />;
  }

  return (
    <>
      {virtualizationEnabled ? (
        <HomeVirtualFeed posts={visiblePosts} />
      ) : (
        <HomeFeed posts={visiblePosts} />
      )}
      {feedEnabled && postsHasMore && <div ref={observePosts} className="h-24" />}
    </>
  );
}
