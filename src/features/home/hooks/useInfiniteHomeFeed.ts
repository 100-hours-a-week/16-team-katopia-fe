import { useCallback, useMemo } from "react";
import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query"; // 무한 스크롤용 React Query 훅입니다.
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

type ApiHomePost = NonNullable<GetHomePostsResponse["posts"]>[number];
const mappedPostCache = new WeakMap<ApiHomePost, HomePost>();

function mapHomePosts(data: GetHomePostsResponse) {
  const posts = data.posts ?? [];

  return posts.map<HomePost>((post) => {
    const cached = mappedPostCache.get(post);
    if (cached) return cached;

    const author = post.author ?? {
      id: 0,
      nickname: "",
    };
    const imageUrls = post.imageUrls ?? [];
    const imageUrl = imageUrls[0] ?? null;
    const avatarKey = author.profileImageObjectKey ?? null;

    const mapped: HomePost = {
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

    mappedPostCache.set(post, mapped);
    return mapped;
  });
}

type HomeFeedQueryData = InfiniteData<GetHomePostsResponse, string | null> & {
  items: HomePost[];
};

export function useInfiniteHomeFeed(params?: {
  size?: number;
  enabled?: boolean;
  initialData?: GetHomePostsResponse | null;
}) {
  const size = params?.size ?? 10;
  const enabled = params?.enabled ?? true;
  const initialData = params?.initialData;
  const hasSeededPosts = (initialData?.posts?.length ?? 0) > 0;

  const { data, hasNextPage, isLoading, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery<
      GetHomePostsResponse,
      Error,
      HomeFeedQueryData,
      ["home-feed", { size: number }, "infinite"],
      string | null
    >({
      queryKey: ["home-feed", { size }, "infinite"],
      enabled,
      initialPageParam: null as string | null,
      initialData: initialData
        ? {
            pages: [initialData],
            pageParams: [null],
          }
        : undefined,
      select: (infiniteData) => {
        const deduped = new Map<number, HomePost>();
        infiniteData.pages.forEach((page) => {
          mapHomePosts(page).forEach((item) => deduped.set(item.id, item));
        });
        return {
          ...infiniteData,
          items: Array.from(deduped.values()),
        };
      },
      refetchOnMount: hasSeededPosts ? false : true,
      refetchOnWindowFocus: false,
      // 짧은 staleTime으로 과도한 재요청은 줄이고 최신성은 유지합니다.
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
        // 같은 커서 반복 응답 시 무한 재호출을 방지합니다.
        if (rawNextCursor === lastPageParam) return undefined;
        return rawNextCursor;
      },
    });

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const hasMore = enabled ? Boolean(hasNextPage) : false;
  const loading = isLoading || isFetchingNextPage;
  const loadMore = useCallback(() => {
    if (!enabled) return;
    if (!hasNextPage) return;
    if (isFetchingNextPage) return;
    void fetchNextPage();
  }, [enabled, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    items: enabled ? items : [],
    hasMore,
    loading,
    isFetchingNextPage,
    loadMore,
  };
}
