"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { deletePost } from "../api/deletePost";
import { dispatchPostCountChange } from "../utils/postCountEvents";
import { getPostDetailViewerState } from "../api/getPostDetailViewerState";
import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import {
  normalizeImageUrls,
  pickImageUrl,
} from "@/src/features/upload/utils/normalizeImageUrls";
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

export function usePostDetail({ postId, initialPost }: UsePostDetailOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const post = initialPost;
  const loading = false;
  const [viewerState, setViewerState] = useState<{
    isLiked?: boolean;
    isBookmarked?: boolean;
  } | null>(null);
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

  const effectiveLiked =
    likedOverride ?? viewerState?.isLiked ?? post?.isLiked ?? false;
  const effectiveBookmarked =
    bookmarkedOverride ??
    viewerState?.isBookmarked ??
    post?.isBookmarked ??
    false;

  useEffect(() => {
    let cancelled = false;

    getPostDetailViewerState(postId)
      .then((res) => {
        if (!cancelled && res) {
          setViewerState(res);
        }
      })
      .catch((e) => {
        if (e?.code === "POST-E-005") {
          alert("게시글을 찾을 수 없습니다.");
          router.replace("/");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [postId, router]);

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
