import { useCallback, useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query"; // 무한 스크롤용 React Query 훅입니다.
import { getHomePosts, type GetHomePostsResponse } from "../api/getHomePosts";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";

export type HomePost = {
  id: number;
  author: {
    id: number;
    displayName: string;
    username: string;
    avatarUrl?: string | null;
    gender?: string | null;
    height?: number | null;
    weight?: number | null;
  };
  imageUrl?: string | null;
  imageUrls?: string[];
  imageCount?: number;
  likeCount: number;
  commentCount: number;
  caption: string;
  tags?: string[];
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt?: string | null;
};

function mapHomePosts(data: GetHomePostsResponse) {
  const posts = data.posts ?? [];

  return posts.map<HomePost>((post) => {
    const author = post.author ?? {
      id: 0,
      nickname: "",
    };
    const imageUrls = post.imageUrls ?? [];
    const imageUrl = imageUrls[0] ?? null;
    const avatarKey = author.profileImageObjectKey ?? null;

    return {
      id: post.id,
      author: {
        id: author.id,
        displayName: author.nickname ?? "",
        username: author.nickname ?? "",
        avatarUrl: avatarKey ? resolveMediaUrl(avatarKey) : null,
        gender: author.gender ?? null,
        height: author.height ?? null,
        weight: author.weight ?? null,
      },
      imageUrl,
      imageUrls,
      imageCount: imageUrls.length,
      likeCount: Number(post.aggregate?.likeCount ?? 0) || 0,
      commentCount: Number(post.aggregate?.commentCount ?? 0) || 0,
      caption: post.content ?? "",
      tags: post.tags ?? [],
      isLiked: Boolean(post.isLiked),
      isBookmarked: Boolean(post.isBookmarked),
      createdAt: post.createdAt ?? null,
    };
  });
}

export function useInfiniteHomeFeed(params?: {
  size?: number;
  enabled?: boolean;
}) {
  const size = params?.size ?? 10;
  const enabled = params?.enabled ?? true;

  const observerRef = useRef<IntersectionObserver | null>(null);

  const { data, hasNextPage, isLoading, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["home-feed", size],
      enabled,
      initialPageParam: null as string | null,
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      queryFn: async ({ pageParam }) =>
        getHomePosts({
          size,
          after: pageParam ?? undefined,
        }),
      getNextPageParam: (lastPage, _allPages, lastPageParam) => {
        const rawNextCursor =
          lastPage.nextCursor === "" ? null : (lastPage.nextCursor ?? null);
        if (rawNextCursor == null) return undefined;
        if (rawNextCursor === lastPageParam) return undefined;
        return rawNextCursor;
      },
    });

  const items = useMemo(() => {
    // 페이지별 데이터를 하나의 리스트로 합치고 ID 기준 중복을 제거
    const map = new Map<number, HomePost>();
    (data?.pages ?? []).forEach((page) => {
      mapHomePosts(page).forEach((item) => map.set(item.id, item));
    });
    return Array.from(map.values());
  }, [data?.pages]);

  const hasMore = enabled ? Boolean(hasNextPage) : false;
  const loading = isLoading || isFetchingNextPage;

  const observe = useCallback(
    (node: HTMLDivElement | null) => {
      // 감시 대상 노드가 바뀔 때마다 기존 옵저버를 정리.
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry?.isIntersecting) return;
          if (!enabled) return;
          if (!hasNextPage) return;
          if (isFetchingNextPage) return;
          fetchNextPage();
        },
        {
          root: null,
          rootMargin: "600px 0px", // 하단 600px 이전부터 미리 로딩을 시작
          threshold: 0.01, // 1%만 보여도 콜백이 실행되도록 설정합니다.
        },
      );

      observerRef.current.observe(node); // 전달받은 노드를 관찰 시작.
    },
    [enabled, fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    // 훅이 언마운트될 때 옵저버를 정리.
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  return {
    items: enabled ? items : [],
    hasMore,
    observe,
    loading,
    loadMore: fetchNextPage,
  };
}
