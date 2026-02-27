"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { deletePost } from "../api/deletePost";
import { dispatchPostCountChange } from "../utils/postCountEvents";
import { getPostDetail } from "../api/getPostDetail";
import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import {
  normalizeImageUrls,
  pickImageUrl,
} from "@/src/features/upload/utils/normalizeImageUrls";

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
  isBookmarked?: boolean;
  aggregate: {
    likeCount: number;
    commentCount: number;
  };
  createdAt: string;
  author: PostAuthor;
};

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

export function usePostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const [bookmarkedOverride, setBookmarkedOverride] = useState<boolean | null>(
    null,
  );
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLikedOverride(null);
    setBookmarkedOverride(null);

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
  const effectiveBookmarked = bookmarkedOverride ?? post?.isBookmarked ?? false;

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

  const handleEdit = useCallback(() => {
    if (!postId) return;
    router.push(`/post/edit/${postId}`);
  }, [postId, router]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!postId) return;
    await deletePost(postId);
    dispatchPostCountChange(-1);
    const from = searchParams.get("from");
    if (from === "profile") {
      router.replace("/profile");
      return;
    }
    if (from === "home") {
      router.replace("/home");
      return;
    }
    router.replace("/search");
  }, [postId, router, searchParams]);

  return {
    postId,
    post,
    loading,
    sortedImageUrls,
    effectiveLiked,
    effectiveBookmarked,
    likedOverride,
    setLikedOverride,
    setBookmarkedOverride,
    deleteOpen,
    setDeleteOpen,
    isMine,
    me,
    handleEdit,
    handleDeleteConfirm,
  };
}
