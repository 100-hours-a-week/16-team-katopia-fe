"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { deletePost } from "../api/deletePost";
import { getPostDetail } from "../api/getPostDetail";
import { dispatchPostCountChange } from "../utils/postCountEvents";
import {
  normalizeImageUrls,
  pickImageUrl,
} from "@/src/features/upload/utils/normalizeImageUrls";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import type { GetHomePostsResponse } from "@/src/features/home/api/getHomePosts";
import type { PostDetail, PostImageItem } from "../types/postDetail";

type HomeFeedInfiniteData = InfiniteData<GetHomePostsResponse, string | null>;

function removeHomeFeedPost(
  data: HomeFeedInfiniteData | undefined,
  postId: number,
) {
  if (!data) return data;
  let changed = false;

  const pages = data.pages.map((page) => {
    const prevPosts = page.posts ?? [];
    const nextPosts = prevPosts.filter((post) => post.id !== postId);
    if (nextPosts.length !== prevPosts.length) changed = true;
    return changed ? { ...page, posts: nextPosts } : page;
  });

  if (!changed) return data;
  return { ...data, pages };
}

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

type UsePostDetailOptions = {
  postId: string;
  initialPost: PostDetail;
};

function getPostDetailRefetchFlagKey(postId: string) {
  return `katopia.postDetailRefetch:${postId}`;
}

export function usePostDetail({ postId, initialPost }: UsePostDetailOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { currentMember } = useAuth();

  const [post, setPost] = useState<PostDetail>(initialPost);
  const loading = false;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const me = currentMember;

  useEffect(() => {
    if (!postId) return;
    const refetchFlagKey = getPostDetailRefetchFlagKey(postId);
    let shouldRefetch = false;

    try {
      shouldRefetch = window.sessionStorage.getItem(refetchFlagKey) === "1";
      if (shouldRefetch) {
        window.sessionStorage.removeItem(refetchFlagKey);
      }
    } catch {}

    if (!shouldRefetch) return;

    let cancelled = false;

    getPostDetail(postId)
      .then((res) => {
        if (cancelled) return;
        const latest = (res as { data?: PostDetail } | null)?.data;
        if (latest) {
          setPost(latest);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [postId]);

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

  const handleEdit = useCallback(() => {
    if (!postId) return;
    router.push(`/post/edit/${postId}`);
  }, [postId, router]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!postId) return;
    await deletePost(postId);
    const numericPostId = Number(postId);
    if (Number.isFinite(numericPostId)) {
      queryClient.setQueriesData<HomeFeedInfiniteData>(
        { queryKey: ["home-feed"] },
        (old) => removeHomeFeedPost(old, numericPostId),
      );
    }
    queryClient.invalidateQueries({ queryKey: ["home-feed"] });
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
  }, [postId, queryClient, router, searchParams]);

  return {
    postId,
    post,
    loading,
    sortedImageUrls,
    deleteOpen,
    setDeleteOpen,
    isMine,
    me,
    handleEdit,
    handleDeleteConfirm,
  };
}
