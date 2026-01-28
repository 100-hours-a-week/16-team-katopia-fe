"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
import { pickImageUrl } from "@/src/features/upload/utils/normalizeImageUrls";

type PostAuthor = {
  nickname: string;
  profileImageUrl?: string | null;
  gender?: "M" | "F" | null;
  height?: number | null;
  weight?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  memberId?: number | string;
  id?: number | string;
  userId?: number | string;
};

type PostImageItem = {
  imageUrl?: string;
  accessUrl?: string;
  url?: string;
  sortOrder?: number;
};

type PostDetail = {
  imageUrls?: string[] | PostImageItem[];
  content?: string | null;
  author?: PostAuthor | null;
  isLiked?: boolean | null;
  isLike?: boolean | null;
  liked?: boolean | null;
  likedByMe?: boolean | null;
  likedYn?: boolean | null;
  likeYn?: boolean | null;
  aggregate?: {
    likeCount?: number | null;
    commentCount?: number | null;
    isLiked?: boolean | null;
    isLike?: boolean | null;
    liked?: boolean | null;
    likedByMe?: boolean | null;
    likedYn?: boolean | null;
    likeYn?: boolean | null;
  } | null;
  createdAt: string;
};

type CommentItem = CommentListItem;

function normalizePostImageUrls(
  value: string[] | PostImageItem[] | undefined,
): string[] {
  if (!value || value.length === 0) return [];
  if (typeof value[0] === "string") {
    return value as string[];
  }

  const items = value as PostImageItem[];
  return [...items]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((img) => pickImageUrl(img))
    .filter(Boolean) as string[];
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const [me, setMe] = useState<{
    id?: number | string;
    nickname?: string;
  } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const sortedImageUrls = useMemo(() => {
    return normalizePostImageUrls(post?.imageUrls);
  }, [post]);

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
      .then((res) => {
        setPost(res.data);
      })
      .catch((e) => {
        if (e?.code === "POST-E-005") {
          alert("게시글을 찾을 수 없습니다.");
          router.replace("/");
        }
      })
      .finally(() => setLoading(false));
  }, [postId, router]);

  useEffect(() => {
    if (!postId) return;
    try {
      const stored = window.localStorage.getItem(`post-liked-${postId}`);
      if (stored == null) return;
      setLikedOverride(stored === "true");
    } catch {
      // ignore storage errors
    }
  }, [postId]);

  useEffect(() => {
    if (!postId) return;

    getComments(postId, { size: 30 })
      .then((res) => {
        setComments(
          res.comments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            nickname: comment.author.nickname,
            profileImageUrl: comment.author.profileImageUrl ?? null,
            authorId: comment.author.id,
          })),
        );
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
        const rawProfile = json.data?.profile ?? {};
        setMe({
          id: rawProfile.memberId ?? rawProfile.id ?? rawProfile.userId,
          nickname: rawProfile.nickname,
        });
      })
      .catch(() => {});
  }, []);

  const handleCreateComment = async (content: string) => {
    if (!postId) return;

    try {
      const newComment = await createComment({
        postId,
        content,
      });

      setComments((prev) => [
        {
          id: newComment.id,
          content: newComment.content,
          createdAt: newComment.createdAt,
          nickname: me?.nickname ?? "나",
          authorId: me?.id,
          isMine: true,
        },
        ...prev,
      ]);
      setPost((prev) => {
        if (!prev?.aggregate) return prev;
        return {
          ...prev,
          aggregate: {
            ...prev.aggregate,
            commentCount: (prev.aggregate.commentCount ?? 0) + 1,
          },
        };
      });
    } catch (e: unknown) {
      const error = e as { code?: string };

      switch (error.code) {
        case "COMMENT-E-001":
          alert("댓글 내용을 입력해주세요.");
          break;
        case "COMMENT-E-002":
          alert("댓글은 최대 200자까지 입력할 수 있습니다.");
          break;
        case "POST-E-005":
          alert("게시글을 찾을 수 없습니다.");
          break;
        case "AUTH-E-002":
          alert("로그인이 필요합니다.");
          router.replace("/login");
          break;
        default:
          alert("댓글 작성에 실패했습니다.");
      }
    }
  };

  const handleUpdateComment = async (id: number, content: string) => {
    if (!postId) return;

    try {
      await updateComment({ postId, commentId: id, content });
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === id ? { ...comment, content } : comment,
        ),
      );
    } catch (e: unknown) {
      const error = e as { code?: string };

      switch (error.code) {
        case "COMMENT-E-001":
          alert("댓글 내용을 입력해주세요.");
          break;
        case "COMMENT-E-002":
          alert("댓글은 최대 200자까지 입력할 수 있습니다.");
          break;
        case "AUTH-E-002":
          alert("로그인이 필요합니다.");
          router.replace("/login");
          break;
        default:
          alert("댓글 수정에 실패했습니다.");
      }
    }
  };

  const handleDeleteComment = async (id: number) => {
    if (!postId) return;

    try {
      await deleteComment({ postId, commentId: id });
      setComments((prev) => prev.filter((comment) => comment.id !== id));
      setPost((prev) => {
        if (!prev?.aggregate) return prev;
        const nextCount = Math.max(0, (prev.aggregate.commentCount ?? 0) - 1);
        return {
          ...prev,
          aggregate: {
            ...prev.aggregate,
            commentCount: nextCount,
          },
        };
      });
    } catch (e: unknown) {
      const error = e as { code?: string };

      switch (error.code) {
        case "AUTH-E-002":
          alert("로그인이 필요합니다.");
          router.replace("/login");
          break;
        default:
          alert("댓글 삭제에 실패했습니다.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }
  if (!post) return null;

  const author = post.author ?? {
    nickname: "",
    profileImageUrl: null,
  };

  const initialLiked = Boolean(
    post.isLiked ??
    post.isLike ??
    post.liked ??
    post.likedByMe ??
    post.likedYn ??
    post.likeYn ??
    post.aggregate?.isLiked ??
    post.aggregate?.isLike ??
    post.aggregate?.liked ??
    post.aggregate?.likedByMe,
  );
  const effectiveLiked = likedOverride ?? initialLiked;

  return (
    <div className="min-h-screen px-4 py-4">
      <PostHeader
        author={author}
        createdAt={post.createdAt}
        isMine={isMine}
        onEdit={() => {
          if (!postId) return;
          router.push(`/post/edit/${postId}`);
        }}
        onDelete={() => setDeleteOpen(true)}
      />

      <PostImageCarousel images={sortedImageUrls} />

      <PostContent
        postId={postId}
        content={post.content ?? ""}
        likeCount={post.aggregate?.likeCount ?? 0}
        commentCount={post.aggregate?.commentCount ?? 0}
        isLiked={effectiveLiked}
        onLikedChange={(nextLiked) => {
          setLikedOverride(nextLiked);
          try {
            window.localStorage.setItem(
              `post-liked-${postId}`,
              String(nextLiked),
            );
          } catch {
            // ignore storage errors
          }
        }}
      />

      <div className="mt-8 border-t border-[#e5e5e5] pt-6">
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
          try {
            await deletePost(postId);
            router.replace("/home");
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            alert("게시글 삭제에 실패했습니다.");
          } finally {
            setDeleteOpen(false);
          }
        }}
      />
    </div>
  );
}
