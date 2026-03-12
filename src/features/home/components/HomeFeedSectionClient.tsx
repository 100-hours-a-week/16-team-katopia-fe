"use client";

import { useMemo } from "react";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
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

function filterOwnPostsByAge(posts: HomePost[]) {
  // 임시 비활성화: 홈 비어 보이는 현상 원인 분리를 위해 내 글 24시간 필터를 적용하지 않습니다.
  return posts;
}

export default function HomeFeedSectionClient({
  size = 10,
  initialFeed = null,
}: HomeFeedSectionClientProps) {
  const { ready, isAuthenticated } = useAuth();
  const hasInitialFeed = (initialFeed?.posts?.length ?? 0) > 0;
  // 인증 상태 확정 후에만 피드 요청을 수행해 초기 빈 캐시를 방지합니다.
  const feedEnabled = ready && isAuthenticated;

  const {
    items: posts,
    hasMore: postsHasMore,
    loading,
    isFetchingNextPage,
    loadMore,
  } = useInfiniteHomeFeed({
    size,
    enabled: feedEnabled,
    initialData: hasInitialFeed ? initialFeed : null,
  });

  const visiblePosts = useMemo(() => filterOwnPostsByAge(posts), [posts]);

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
      <HomeVirtualFeed
        posts={visiblePosts}
        hasMore={feedEnabled && postsHasMore}
        loading={isFetchingNextPage}
        loadMore={loadMore}
      />
    </>
  );
}
