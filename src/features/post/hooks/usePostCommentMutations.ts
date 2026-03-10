"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "../api/createComment";
import { deleteComment } from "../api/deleteComment";
import { updateComment } from "../api/updateComment";
import {
  applyHomeFeedCommentCountDelta,
  patchCommentsCache,
  type CommentsInfiniteData,
  type CreateCommentContext,
  type CreateCommentVariables,
  type CurrentUser,
  type HomeFeedInfiniteData,
} from "./usePostComments.shared";

type CommentsQueryKey = readonly ["comments", string | undefined];

export function usePostCommentMutations(
  postId: string | undefined,
  currentUser: CurrentUser | null,
  options: { onCountChange?: (delta: number) => void } | undefined,
  commentsQueryKey: CommentsQueryKey,
  numericPostId: number,
) {
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation<
    Awaited<ReturnType<typeof createComment>>,
    unknown,
    CreateCommentVariables,
    CreateCommentContext
  >({
    mutationFn: async ({ content }) => {
      if (!postId) throw new Error("postId is required");
      return createComment({ postId, content });
    },
    onMutate: async ({ content }) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const optimistic = {
        id: tempId,
        content,
        createdAt: new Date().toISOString(),
        nickname: currentUser?.nickname ?? "나",
        authorId: currentUser?.id,
        profileImageUrl: currentUser?.profileImageUrl ?? null,
        isMine: true,
      };

      queryClient.setQueryData<CommentsInfiniteData>(commentsQueryKey, (old) =>
        patchCommentsCache(old, (items) => [optimistic, ...items]),
      );
      options?.onCountChange?.(1);
      return { tempId, optimistic };
    },
    onSuccess: (newComment, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData<CommentsInfiniteData>(commentsQueryKey, (old) =>
        patchCommentsCache(old, (items) =>
          items.map((c) =>
            c.id === context.tempId
              ? {
                  id: newComment.id,
                  content: newComment.content,
                  createdAt: newComment.createdAt,
                  nickname: context.optimistic.nickname,
                  authorId: context.optimistic.authorId,
                  profileImageUrl: context.optimistic.profileImageUrl,
                  isMine: true,
                }
              : c,
          ),
        ),
      );

      if (Number.isFinite(numericPostId)) {
        queryClient.setQueriesData<HomeFeedInfiniteData>(
          { queryKey: ["home-feed"] },
          (old) => applyHomeFeedCommentCountDelta(old, numericPostId, 1),
        );
      }
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData<CommentsInfiniteData>(commentsQueryKey, (old) =>
        patchCommentsCache(old, (items) =>
          items.filter((c) => c.id !== context.tempId),
        ),
      );
      options?.onCountChange?.(-1);
    },
  });

  const updateCommentMutation = useMutation<
    Awaited<ReturnType<typeof updateComment>>,
    unknown,
    { id: number | string; content: string }
  >({
    mutationFn: async ({ id, content }) => {
      if (!postId) throw new Error("postId is required");
      if (typeof id !== "number") {
        throw new Error("Cannot update optimistic comment before server sync");
      }
      return updateComment({ postId, commentId: id, content });
    },
    onSuccess: (_data, { id, content }) => {
      queryClient.setQueryData<CommentsInfiniteData>(commentsQueryKey, (old) =>
        patchCommentsCache(old, (items) =>
          items.map((c) => (c.id === id ? { ...c, content } : c)),
        ),
      );
    },
  });

  const deleteCommentMutation = useMutation<
    Awaited<ReturnType<typeof deleteComment>>,
    unknown,
    { id: number | string }
  >({
    mutationFn: async ({ id }) => {
      if (!postId) throw new Error("postId is required");
      if (typeof id !== "number") {
        throw new Error("Cannot delete optimistic comment before server sync");
      }
      return deleteComment({ postId, commentId: id });
    },
    onSuccess: (_data, { id }) => {
      queryClient.setQueryData<CommentsInfiniteData>(commentsQueryKey, (old) =>
        patchCommentsCache(old, (items) => items.filter((c) => c.id !== id)),
      );
      options?.onCountChange?.(-1);
      if (Number.isFinite(numericPostId)) {
        queryClient.setQueriesData<HomeFeedInfiniteData>(
          { queryKey: ["home-feed"] },
          (old) => applyHomeFeedCommentCountDelta(old, numericPostId, -1),
        );
      }
    },
  });

  const handleCreateComment = useCallback(
    async (content: string) => {
      if (!postId) return;
      await createCommentMutation.mutateAsync({ content });
    },
    [createCommentMutation, postId],
  );

  const handleUpdateComment = useCallback(
    async (id: number | string, content: string) => {
      if (!postId) return;
      if (typeof id !== "number") return;
      await updateCommentMutation.mutateAsync({ id, content });
    },
    [postId, updateCommentMutation],
  );

  const handleDeleteComment = useCallback(
    async (id: number | string) => {
      if (!postId) return;
      if (typeof id !== "number") return;
      await deleteCommentMutation.mutateAsync({ id });
    },
    [deleteCommentMutation, postId],
  );

  return {
    handleCreateComment,
    handleUpdateComment,
    handleDeleteComment,
  };
}
