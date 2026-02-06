"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createComment } from "../api/createComment";
import { deleteComment } from "../api/deleteComment";
import { getComments, type CommentItemResponse } from "../api/getComments";
import { updateComment } from "../api/updateComment";
import type { Comment as CommentListItem } from "../components/CommentList";

type CommentItem = CommentListItem;

type CurrentUser = {
  id?: number | string;
  nickname?: string;
  profileImageUrl?: string | null;
};

function dedupeComments(items: CommentItem[]) {
  const seen = new Set<number>();
  const next: CommentItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    next.push(item);
  }
  return next;
}

export function usePostComments(
  postId: string | undefined,
  currentUser: CurrentUser | null,
  options?: { onCountChange?: (delta: number) => void },
) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const nextCursorRef = useRef<number | string | null>(null);
  const hasMoreRef = useRef(true);
  const inFlightRef = useRef(false);
  const lastRequestedCursorRef = useRef<number | string | "__first__" | null>(
    null,
  );

  const mapComments = useCallback((items: CommentItemResponse[]) => {
    return items.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      nickname: comment.author.nickname,
      profileImageUrl:
        comment.author.profileImageObjectKey ??
        comment.author.profileImageUrl ??
        null,
      authorId: comment.author.id,
    }));
  }, []);

  const loadMore = useCallback(async () => {
    if (!postId) return;
    if (inFlightRef.current) return;
    if (!hasMoreRef.current) return;

    const cursorKey = nextCursorRef.current ?? "__first__";
    if (lastRequestedCursorRef.current === cursorKey) return;
    lastRequestedCursorRef.current = cursorKey;

    inFlightRef.current = true;
    setLoading(true);

    try {
      const prevCursor = nextCursorRef.current;
      const res = await getComments(postId, {
        size: 30,
        after:
          nextCursorRef.current != null
            ? nextCursorRef.current
            : undefined,
      });

      const mapped = mapComments(res.comments);
      setComments((prev) => dedupeComments([...prev, ...mapped]));

      const nextCursor =
        res.nextCursor === "" ? null : (res.nextCursor ?? null);
      nextCursorRef.current = nextCursor;
      const nextHasMore =
        nextCursor != null && mapped.length > 0 && nextCursor !== prevCursor;
      setHasMore(nextHasMore);
      hasMoreRef.current = nextHasMore;
    } catch {
      setHasMore(false);
      hasMoreRef.current = false;
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [mapComments, postId]);

  useEffect(() => {
    if (!postId) return;
    setComments([]);
    setHasMore(true);
    nextCursorRef.current = null;
    hasMoreRef.current = true;
    inFlightRef.current = false;
    lastRequestedCursorRef.current = null;
    loadMore();
  }, [loadMore, postId]);

  const handleCreateComment = useCallback(
    async (content: string) => {
      if (!postId) return;
      const tempId = -Date.now();
      const optimistic = {
        id: tempId,
        content,
        createdAt: new Date().toISOString(),
        nickname: currentUser?.nickname ?? "나",
        authorId: currentUser?.id,
        profileImageUrl: currentUser?.profileImageUrl ?? null,
        isMine: true,
      };

      setComments((prev) => dedupeComments([optimistic, ...prev]));
      options?.onCountChange?.(1);

      try {
        const newComment = await createComment({ postId, content });
        setComments((prev) =>
          dedupeComments(
            prev.map((c) =>
              c.id === tempId
                ? {
                    id: newComment.id,
                    content: newComment.content,
                    createdAt: newComment.createdAt,
                    nickname: optimistic.nickname,
                    authorId: optimistic.authorId,
                    profileImageUrl: optimistic.profileImageUrl,
                    isMine: true,
                  }
                : c,
            ),
          ),
        );
      } catch (error) {
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        options?.onCountChange?.(-1);
        throw error;
      }
    },
    [
      currentUser?.id,
      currentUser?.nickname,
      currentUser?.profileImageUrl,
      options,
      postId,
    ],
  );

  const handleUpdateComment = useCallback(
    async (id: number, content: string) => {
      if (!postId) return;
      await updateComment({ postId, commentId: id, content });
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, content } : c)),
      );
    },
    [postId],
  );

  const handleDeleteComment = useCallback(
    async (id: number) => {
      if (!postId) return;
      await deleteComment({ postId, commentId: id });
      setComments((prev) => prev.filter((c) => c.id !== id));
      options?.onCountChange?.(-1);
    },
    [options, postId],
  );

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
