"use client";

import { useCallback, useMemo } from "react";
import { usePostCommentMutations } from "./usePostCommentMutations";
import { usePostCommentsQuery } from "./usePostCommentsQuery";
import type { CurrentUser } from "./usePostComments.shared";

export function usePostComments(
  postId: string | undefined,
  currentUser: CurrentUser | null,
  options?: { onCountChange?: (delta: number) => void },
) {
  const numericPostId = useMemo(() => Number(postId), [postId]);
  const commentsQueryKey = useMemo(
    () => ["comments", postId] as const,
    [postId],
  );

  const {
    comments,
    loading,
    hasMore,
    isFetchingNextPage,
    fetchNextPage,
  } = usePostCommentsQuery(postId, commentsQueryKey);

  const { handleCreateComment, handleUpdateComment, handleDeleteComment } =
    usePostCommentMutations(
      postId,
      currentUser,
      options,
      commentsQueryKey,
      numericPostId,
    );

  const loadMore = useCallback(async () => {
    if (!hasMore) return;
    if (isFetchingNextPage) return;
    await fetchNextPage();
  }, [fetchNextPage, hasMore, isFetchingNextPage]);

  return {
    comments,
    loading,
    hasMore,
    loadMore,
    handleCreateComment,
    handleUpdateComment,
    handleDeleteComment,
  };
}
