"use client";

import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import HomeFeed from "./HomeFeed";
import HomeFeedSkeleton from "./HomeFeedSkeleton";
import { useInfiniteHomeFeed } from "../hooks/useInfiniteHomeFeed";
import { useHomeScrollRestoration } from "../hooks/useHomeScrollRestoration";
import HomeVirtualFeed from "./HomeVirtualFeed";
import type { GetHomePostsResponse } from "../api/getHomePosts";

type HomeFeedSectionClientProps = {
  size?: number;
  initialFeed?: GetHomePostsResponse | null;
};

const VIRTUALIZATION_START_COUNT = 30;

export default function HomeFeedSectionClient({
  size = 10,
  initialFeed = null,
}: HomeFeedSectionClientProps) {
  const { ready, isAuthenticated } = useAuth();
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

  const virtualizationEnabled = posts.length >= VIRTUALIZATION_START_COUNT;

  useHomeScrollRestoration(posts.length);

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
        <HomeVirtualFeed posts={posts} />
      ) : (
        <HomeFeed posts={posts} />
      )}
      {feedEnabled && postsHasMore && <div ref={observePosts} className="h-24" />}
    </>
  );
}
