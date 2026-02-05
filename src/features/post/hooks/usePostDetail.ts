"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { deletePost } from "../api/deletePost";
import { getPostDetail } from "../api/getPostDetail";
import { createComment } from "../api/createComment";
import { deleteComment } from "../api/deleteComment";
import { getComments } from "../api/getComments";
import { updateComment } from "../api/updateComment";
import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import {
  normalizeImageUrls,
  pickImageUrl,
} from "@/src/features/upload/utils/normalizeImageUrls";
import type { Comment as CommentListItem } from "../components/CommentList";

type PostAuthor = {
  nickname: string;
  profileImageUrl?: string | null;
  profileImageObjectKey?: string | null;
  gender?: "M" | "F" | null;
  height?: number | null;
  weight?: number | null;
  memberId?: number | string;
  id?: number | string;
  userId?: number | string;
};

type PostImageItem = {
  imageObjectKey?: string;
  imageUrl?: string;
  accessUrl?: string;
  url?: string;
  sortOrder?: number;
};

type PostDetail = {
  imageUrls?: PostImageItem[] | string[];
  imageObjectKeys?: PostImageItem[] | string[];
  content: string;
  isLiked: boolean;
  aggregate: {
    likeCount: number;
    commentCount: number;
  };
  createdAt: string;
  author: PostAuthor;
};

type CommentItem = CommentListItem;

function normalizePostImageUrls(
  value: PostImageItem[] | string[] | undefined,
): string[] {
  if (!value || value.length === 0) return [];

  if (typeof value[0] === "string") {
    return normalizeImageUrls(value as string[]);
  }

  return [...(value as PostImageItem[])]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((img) => pickImageUrl(img))
    .filter(Boolean) as string[];
}

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

export function usePostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [me, setMe] = useState<{
    id?: number | string;
    nickname?: string;
    profileImageUrl?: string | null;
  } | null>(null);

  const sortedImageUrls = useMemo(
    () => normalizePostImageUrls(post?.imageObjectKeys ?? post?.imageUrls),
    [post],
  );

  const isMine = useMemo(() => {
    if (!post?.author) return false;
    const authorId =
      post.author.memberId ?? post.author.id ?? post.author.userId;
    if (authorId != null && me?.id != null) {
      return String(authorId) === String(me.id);
    }
    if (post.author.nickname && me?.nickname) {
      return post.author.nickname === me.nickname;
    }
    return false;
  }, [post, me]);

  useEffect(() => {
    if (!postId) return;

    getPostDetail(postId)
      .then((res) => setPost(res.data))
      .catch((e) => {
        if (e?.code === "POST-E-005") {
          alert("게시글을 찾을 수 없습니다.");
          router.replace("/");
        }
      })
      .finally(() => setLoading(false));
  }, [postId, router]);

  const effectiveLiked = likedOverride ?? post?.isLiked ?? false;

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

  useEffect(() => {
    authFetch(`${API_BASE_URL}/api/members/me`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) return;
        const profile = json.data?.profile ?? {};
        const memberId = json.data?.id ?? profile.memberId ?? profile.id;
        setMe({
          id: memberId,
          nickname: profile.nickname,
          profileImageUrl:
            profile.profileImageObjectKey ?? profile.profileImageUrl ?? null,
        });
      })
      .catch(() => {});
  }, []);

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
            nickname: me?.nickname ?? "나",
            authorId: me?.id,
            profileImageUrl: me?.profileImageUrl ?? null,
            isMine: true,
          },
          ...prev,
        ]),
      );

      setPost((prev) =>
        prev
          ? {
              ...prev,
              aggregate: {
                ...prev.aggregate,
                commentCount: prev.aggregate.commentCount + 1,
              },
            }
          : prev,
      );
    },
    [me?.id, me?.nickname, me?.profileImageUrl, postId],
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
      setPost((prev) =>
        prev
          ? {
              ...prev,
              aggregate: {
                ...prev.aggregate,
                commentCount: Math.max(0, prev.aggregate.commentCount - 1),
              },
            }
          : prev,
      );
    },
    [postId],
  );

  const handleEdit = useCallback(() => {
    if (!postId) return;
    router.push(`/post/edit/${postId}`);
  }, [postId, router]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!postId) return;
    await deletePost(postId);
    const from = searchParams.get("from");
    router.replace(from === "profile" ? "/profile" : "/search");
  }, [postId, router, searchParams]);

  return {
    postId,
    post,
    comments,
    loading,
    sortedImageUrls,
    effectiveLiked,
    likedOverride,
    setLikedOverride,
    deleteOpen,
    setDeleteOpen,
    isMine,
    me,
    handleCreateComment,
    handleUpdateComment,
    handleDeleteComment,
    handleEdit,
    handleDeleteConfirm,
  };
}
