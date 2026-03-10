"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getComments } from "../api/getComments";
import {
  dedupeComments,
  mapComments,
  normalizeNextCursor,
} from "./usePostComments.shared";

type CommentsQueryKey = readonly ["comments", string | undefined];

export function usePostCommentsQuery(
  postId: string | undefined,
  commentsQueryKey: CommentsQueryKey,
) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: commentsQueryKey,
    enabled: Boolean(postId),
    initialPageParam: null as number | string | null,
    queryFn: async ({ pageParam }) => {
      if (!postId) return { comments: [], nextCursor: null };
      try {
        const res = await getComments(postId, {
          size: 30,
          after: pageParam ?? undefined,
        });
        return {
          comments: mapComments(res.comments),
          nextCursor: normalizeNextCursor(res.nextCursor),
        };
      } catch (error) {
        console.error("[usePostComments] getComments failed", error);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => {
      const nextCursor = normalizeNextCursor(lastPage.nextCursor);
      return nextCursor == null ? undefined : nextCursor;
    },
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const comments = useMemo(() => {
    const all = (data?.pages ?? []).flatMap((page) => page.comments);
    return dedupeComments(all);
  }, [data?.pages]);

  return {
    comments,
    loading: isLoading || isFetchingNextPage,
    hasMore: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
  };
}
