"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { useInfinitePostGrid } from "@/src/features/search/hooks/useInfinitePostGrid";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { useInfiniteMyVotes } from "@/src/features/vote/hooks/useInfiniteMyVotes";
import { deleteVote } from "@/src/features/vote/api/deleteVote";

export type Profile = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  gender: "male" | "female" | null;
  height: number | null;
  weight: number | null;
  style: string[];
};

type ApiAggregate = {
  postCount?: number | null;
  followerCount?: number | null;
  followingCount?: number | null;
};

export function useMyProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const { ready, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "bookmarks" | "votes">(
    "posts",
  );
  const [postCount, setPostCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [voteMenuOpenId, setVoteMenuOpenId] = useState<string | number | null>(
    null,
  );
  const [voteDeleteOpen, setVoteDeleteOpen] = useState(false);
  const [pendingDeleteVoteId, setPendingDeleteVoteId] = useState<
    string | number | null
  >(null);
  const [pendingDeleteTitle, setPendingDeleteTitle] = useState("");
  const [voteDeleting, setVoteDeleting] = useState(false);
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
    enabled: activeTab === "posts",
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
    if (!ready || !isAuthenticated) return;

    const fetchMe = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/members/me`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("내 정보 조회 실패");
        }

        const json = await res.json();
        const rawProfile = json.data.profile;
        const apiAggregate: ApiAggregate | undefined =
          json.data?.aggregate ?? json.aggregate;
        const userId = json.data.id;
        const normalizedGender =
          rawProfile.gender === "M" || rawProfile.gender === "MALE"
            ? "male"
            : rawProfile.gender === "F" || rawProfile.gender === "FEMALE"
              ? "female"
              : null;

        const profileImageKey =
          rawProfile.profileImageObjectKey ?? rawProfile.profileImageUrl;
        setProfile({
          userId,
          ...rawProfile,
          gender: normalizedGender,
          profileImageUrl: profileImageKey ?? null,
          height: rawProfile.height,
          weight: rawProfile.weight,
        });
        setPostCount(Number(apiAggregate?.postCount ?? 0) || 0);
        setFollowerCount(Number(apiAggregate?.followerCount ?? 0) || 0);
        setFollowingCount(Number(apiAggregate?.followingCount ?? 0) || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [ready, isAuthenticated, searchParamsKey]);

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

  const handleTabChange = (nextTab: "posts" | "bookmarks" | "votes") => {
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/profile?${nextQuery}` : "/profile");
  };

  const stats = useMemo(
    () => ({
      postCount,
      followerCount,
      followingCount,
    }),
    [postCount, followerCount, followingCount],
  );

  const handleFollowerClick = useCallback(() => {
    const nickname = profileNickname;
    const memberId = profileMemberId;
    router.push(
      `/profile/follows?tab=follower&nickname=${encodeURIComponent(
        nickname,
      )}&followers=${followerCount}&following=${followingCount}&memberId=${memberId}`,
    );
  }, [followerCount, followingCount, profileMemberId, profileNickname, router]);

  const handleFollowingClick = useCallback(() => {
    const nickname = profileNickname;
    const memberId = profileMemberId;
    router.push(
      `/profile/follows?tab=following&nickname=${encodeURIComponent(
        nickname,
      )}&followers=${followerCount}&following=${followingCount}&memberId=${memberId}`,
    );
  }, [followerCount, followingCount, profileMemberId, profileNickname, router]);

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
    loading,
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
