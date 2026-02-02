"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { deletePost } from "../api/deletePost";
import { getPostDetail } from "../api/getPostDetail";
import { createComment } from "../api/createComment";
import { deleteComment } from "../api/deleteComment";
import { getComments } from "../api/getComments";
import { updateComment } from "../api/updateComment";
import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

import PostHeader from "./PostHeader";
import PostDeleteConfirmModal from "./PostDeleteConfirmModal";
import PostImageCarousel from "./PostImageCarousel";
import PostContent from "./PostContent";
import CommentInput from "./CommentInput";
import CommentList, { type Comment as CommentListItem } from "./CommentList";
import {
  normalizeImageUrls,
  pickImageUrl,
} from "@/src/features/upload/utils/normalizeImageUrls";

/* ================= 타입 ================= */

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

/* ================= 유틸 ================= */

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

/* ================= 페이지 ================= */

export default function PostDetailPage() {
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
    () =>
      normalizePostImageUrls(
        post?.imageObjectKeys ?? post?.imageUrls,
      ),
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

  /* ================= 게시글 ================= */

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

  /* ================= 댓글 ================= */

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

  /* ================= 내 정보 ================= */

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

  /* ================= 댓글 핸들러 ================= */

  const handleCreateComment = async (content: string) => {
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
  };

  const handleUpdateComment = async (id: number, content: string) => {
    if (!postId) return;
    await updateComment({ postId, commentId: id, content });
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, content } : c)),
    );
  };

  const handleDeleteComment = async (id: number) => {
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
  };

  /* ================= 렌더 ================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen px-4 py-4">
      <PostHeader
        author={post.author}
        createdAt={post.createdAt}
        isMine={isMine}
        onEdit={() => router.push(`/post/edit/${postId}`)}
        onDelete={() => setDeleteOpen(true)}
      />

      <PostImageCarousel images={sortedImageUrls} />

      <PostContent
        postId={postId}
        content={post.content}
        likeCount={post.aggregate.likeCount}
        commentCount={post.aggregate.commentCount}
        isLiked={effectiveLiked}
        onLikedChange={(next) => {
          setLikedOverride(next);
        }}
      />

      <div className="mt-8 border-t pt-6">
        <CommentInput onSubmit={handleCreateComment} />
        <CommentList
          comments={comments}
          onDelete={handleDeleteComment}
          onUpdate={handleUpdateComment}
          currentUserId={me?.id}
          currentUserNickname={me?.nickname}
        />
      </div>

      <PostDeleteConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          if (!postId) return;
          await deletePost(postId);
          router.replace(
            searchParams.get("from") === "profile" ? "/profile" : "/home",
          );
        }}
      />
    </div>
  );
}
