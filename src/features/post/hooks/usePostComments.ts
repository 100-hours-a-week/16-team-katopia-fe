"use client";

import { useCallback, useEffect, useState } from "react";

import { createComment } from "../api/createComment";
import { deleteComment } from "../api/deleteComment";
import { getComments } from "../api/getComments";
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
) {
  const [comments, setComments] = useState<CommentItem[]>([]);

  useEffect(() => {
    if (!postId) return;

    getComments(postId, { size: 30 })
      .then((res) => {
        const mapped = res.comments.map((comment) => ({
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
        setComments(dedupeComments(mapped));
      })
      .catch(() => {});
  }, [postId]);

  const handleCreateComment = useCallback(
    async (content: string) => {
      if (!postId) return;

      const newComment = await createComment({ postId, content });

      setComments((prev) =>
        dedupeComments([
          {
            id: newComment.id,
            content: newComment.content,
            createdAt: newComment.createdAt,
            nickname: currentUser?.nickname ?? "나",
            authorId: currentUser?.id,
            profileImageUrl: currentUser?.profileImageUrl ?? null,
            isMine: true,
          },
          ...prev,
        ]),
      );
    },
    [currentUser?.id, currentUser?.nickname, currentUser?.profileImageUrl, postId],
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
    },
    [postId],
  );

  return {
    comments,
    handleCreateComment,
    handleUpdateComment,
    handleDeleteComment,
  };
}
