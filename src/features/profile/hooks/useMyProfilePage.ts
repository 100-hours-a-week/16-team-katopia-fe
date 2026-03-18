"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfinitePostGrid } from "@/src/features/search/hooks/useInfinitePostGrid";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { useInfiniteMyVotes } from "@/src/features/vote/hooks/useInfiniteMyVotes";
import { deleteVote } from "@/src/features/vote/api/deleteVote";
import { useOptimisticPostCount } from "./useOptimisticPostCount";
import { useMyProfileQuery } from "@/src/features/profile/hooks/useProfileQueries";

export function useMyProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<"posts" | "bookmarks" | "votes">(
    "posts",
  );
  const [postCount, setPostCount] = useState(0);
  const [voteMenuOpenId, setVoteMenuOpenId] = useState<string | number | null>(
    null,
  );
  const [voteDeleteOpen, setVoteDeleteOpen] = useState(false);
  const [pendingDeleteVoteId, setPendingDeleteVoteId] = useState<
    string | number | null
  >(null);
  const [pendingDeleteTitle, setPendingDeleteTitle] = useState("");
  const [voteDeleting, setVoteDeleting] = useState(false);
  const profileQuery = useMyProfileQuery(ready && isAuthenticated);
  const profile = profileQuery.data?.profile ?? null;
  const counts = profileQuery.data?.counts;
  const optimisticPostCount = useOptimisticPostCount(postCount);
  const profileNickname = profile?.nickname ?? "";
  const profileMemberId = profile?.userId ?? "";

  const {
    items: posts,
    loading: postsLoading,
    hasMore: postsHasMore,
    observe: observePosts,
  } = useInfinitePostGrid({
    memberId: profile?.userId,
    size: 30,
    mode: "member",
    enabled: activeTab === "posts" && typeof profile?.userId === "number",
  });

  const {
    items: bookmarks,
    loading: bookmarksLoading,
    hasMore: bookmarksHasMore,
    observe: observeBookmarks,
  } = useInfinitePostGrid({
    size: 30,
    mode: "bookmarks",
    enabled: activeTab === "bookmarks",
  });

  const {
    items: votes,
    loading: votesLoading,
    hasMore: votesHasMore,
    observe: observeVotes,
    removeById: removeVoteById,
  } = useInfiniteMyVotes({
    size: 20,
    enabled: activeTab === "votes",
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "bookmarks") {
      setActiveTab("bookmarks");
      return;
    }
    if (tab === "votes") {
      setActiveTab("votes");
      return;
    }
    if (tab === "posts") {
      setActiveTab("posts");
    }
  }, [searchParams]);

  useEffect(() => {
    const nextPostCount = counts?.postCount;
    if (nextPostCount == null) return;
    setPostCount((prev) => Math.max(prev, nextPostCount));
  }, [counts?.postCount]);

  useEffect(() => {
    if (posts.length === 0) return;
    setPostCount((prev) => (prev > posts.length ? prev : posts.length));
  }, [posts.length]);

  const handleTabChange = (nextTab: "posts" | "bookmarks" | "votes") => {
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/profile?${nextQuery}` : "/profile");
  };

  const stats = useMemo(
    () => ({
      postCount: optimisticPostCount,
      followerCount: counts?.followerCount ?? null,
      followingCount: counts?.followingCount ?? null,
    }),
    [counts?.followerCount, counts?.followingCount, optimisticPostCount],
  );

  const handleFollowerClick = useCallback(() => {
    const nickname = profileNickname;
    const memberId = profileMemberId;
    router.push(
      `/profile/follows?tab=follower&nickname=${encodeURIComponent(
        nickname,
      )}&followers=${counts?.followerCount ?? 0}&following=${counts?.followingCount ?? 0}&memberId=${memberId}`,
    );
  }, [
    counts?.followerCount,
    counts?.followingCount,
    profileMemberId,
    profileNickname,
    router,
  ]);

  const handleFollowingClick = useCallback(() => {
    const nickname = profileNickname;
    const memberId = profileMemberId;
    router.push(
      `/profile/follows?tab=following&nickname=${encodeURIComponent(
        nickname,
      )}&followers=${counts?.followerCount ?? 0}&following=${counts?.followingCount ?? 0}&memberId=${memberId}`,
    );
  }, [
    counts?.followerCount,
    counts?.followingCount,
    profileMemberId,
    profileNickname,
    router,
  ]);

  const openDeleteModal = (voteId: string | number, title: string) => {
    setVoteMenuOpenId(null);
    setPendingDeleteVoteId(voteId);
    setPendingDeleteTitle(title);
    setVoteDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    setVoteDeleteOpen(false);
  };

  const confirmDeleteVote = async () => {
    if (voteDeleting || pendingDeleteVoteId == null) return;
    setVoteDeleting(true);
    try {
      await deleteVote(pendingDeleteVoteId);
      removeVoteById(pendingDeleteVoteId);
      setVoteDeleteOpen(false);
      setPendingDeleteVoteId(null);
      setPendingDeleteTitle("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "투표 삭제에 실패했습니다.";
      alert(message);
    } finally {
      setVoteDeleting(false);
    }
  };

  return {
    router,
    ready,
    isAuthenticated,
    profile,
    loading: profileQuery.isPending,
    activeTab,
    handleTabChange,
    stats,
    handleFollowerClick,
    handleFollowingClick,
    posts,
    postsLoading,
    postsHasMore,
    observePosts,
    bookmarks,
    bookmarksLoading,
    bookmarksHasMore,
    observeBookmarks,
    votes,
    votesLoading,
    votesHasMore,
    observeVotes,
    voteMenuOpenId,
    setVoteMenuOpenId,
    voteDeleteOpen,
    pendingDeleteTitle,
    voteDeleting,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteVote,
  };
}
