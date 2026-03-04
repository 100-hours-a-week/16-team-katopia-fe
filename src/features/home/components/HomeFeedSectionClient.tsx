"use client";

import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import HomeFeed from "./HomeFeed";
import HomeFeedSkeleton from "./HomeFeedSkeleton";
import { useInfiniteHomeFeed } from "../hooks/useInfiniteHomeFeed";
import { useHomeScrollRestoration } from "../hooks/useHomeScrollRestoration";

type HomeFeedSectionClientProps = {
  size?: number;
};

export default function HomeFeedSectionClient({
  size = 10,
}: HomeFeedSectionClientProps) {
  const { ready, isAuthenticated } = useAuth();
  // auth bootstrap 완료 전에도 피드 요청을 먼저 시작해 LCP 리소스 발견 시점을 앞당긴다.
  const feedEnabled = !ready || isAuthenticated;

  const {
    items: posts,
    hasMore: postsHasMore,
    observe: observePosts,
    loading,
  } = useInfiniteHomeFeed({
    size,
    enabled: feedEnabled,
  });

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
      <HomeFeed posts={posts} />
      {feedEnabled && postsHasMore && <div ref={observePosts} className="h-24" />}
    </>
  );
}
