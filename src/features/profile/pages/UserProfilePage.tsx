"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useInfinitePostGrid } from "@/src/features/search/hooks/useInfinitePostGrid";
import ProfilePostGrid from "../components/ProfilePostGrid";
import ProfileSummary from "../components/ProfileSummary";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { followMember } from "@/src/features/profile/api/followMember";
import { unfollowMember } from "@/src/features/profile/api/unfollowMember";
import {
  useMemberProfileQuery,
  useMyProfileQuery,
} from "@/src/features/profile/hooks/useProfileQueries";

interface Props {
  userId: string;
}

export default function UserProfilePage({ userId }: Props) {
  const router = useRouter();
  const memberId = Number(userId);
  const { ready, isAuthenticated } = useAuth();

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const profileEnabled = ready && isAuthenticated && Number.isFinite(memberId);
  const profileQuery = useMemberProfileQuery(memberId, profileEnabled);
  const myProfileQuery = useMyProfileQuery(ready && isAuthenticated);
  const profile = profileQuery.data?.profile ?? null;
  const isMe = myProfileQuery.data?.profile.userId === memberId;

  const {
    items: posts,
    loading: postsLoading,
    hasMore: postsHasMore,
    observe: observePosts,
  } = useInfinitePostGrid({
    memberId,
    size: 30,
    mode: "member",
    enabled: profileEnabled,
  });

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace("/home");
    }
  }, [ready, isAuthenticated, router]);

  useEffect(() => {
    const nextCounts = profileQuery.data?.counts;
    if (!nextCounts) return;
    if (nextCounts.postCount !== null) {
      setPostCount(nextCounts.postCount);
    }
    if (nextCounts.followerCount !== null) {
      setFollowerCount(nextCounts.followerCount);
    }
    if (nextCounts.followingCount !== null) {
      setFollowingCount(nextCounts.followingCount);
    }
  }, [profileQuery.data?.counts]);

  useEffect(() => {
    const serverFollowing = profileQuery.data?.isFollowing;
    if (typeof serverFollowing === "boolean") {
      setIsFollowing(serverFollowing);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          `following:${memberId}`,
          serverFollowing ? "1" : "0",
        );
      }
      return;
    }

    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(`following:${memberId}`);
    if (stored === "1") setIsFollowing(true);
    if (stored === "0") setIsFollowing(false);
  }, [memberId, profileQuery.data?.isFollowing]);

  useEffect(() => {
    if (posts.length === 0) return;
    setPostCount((prev) => (prev > posts.length ? prev : posts.length));
  }, [posts.length]);

  /* ================= 게시글 ================= */

  /* ================= UI ================= */

  if (!ready || !isAuthenticated) {
    return null;
  }

  const loading = profileQuery.isPending || myProfileQuery.isPending;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        사용자를 찾을 수 없습니다.
      </div>
    );
  }

  const followListQuery = `followers=${followerCount}&following=${followingCount}&memberId=${memberId}`;

  return (
    <div className="min-h-screen px-4 py-4">
      <div className="flex items-center justify-between">
        {/* 뒤로가기 */}
        <button
          type="button"
          onClick={() => {
            router.back();
          }}
        >
          <Image src="/icons/back.svg" alt="뒤로가기" width={24} height={24} />
        </button>

        {!isMe && (
          <button
            type="button"
            disabled={followLoading}
            onClick={async () => {
              if (followLoading) return;
              setFollowLoading(true);
              try {
                const result = isFollowing
                  ? await unfollowMember(memberId)
                  : await followMember(memberId);
                const nextIsFollowing = result.isFollowing ?? !isFollowing;
                setIsFollowing(nextIsFollowing);
                if (typeof result.aggregate?.followerCount === "number") {
                  setFollowerCount(result.aggregate.followerCount);
                } else {
                  setFollowerCount((prev) =>
                    Math.max(0, prev + (nextIsFollowing ? 1 : -1)),
                  );
                }
                if (typeof result.aggregate?.followingCount === "number") {
                  setFollowingCount(result.aggregate.followingCount);
                }
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(
                    `following:${memberId}`,
                    nextIsFollowing ? "1" : "0",
                  );
                }
              } catch (err) {
                const status =
                  typeof err === "object" && err !== null && "status" in err
                    ? Number((err as { status?: number }).status)
                    : null;
                if (!isFollowing && status === 409) {
                  setIsFollowing(true);
                  setFollowerCount((prev) => prev + 1);
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(`following:${memberId}`, "1");
                  }
                  return;
                }
                if (isFollowing && status === 409) {
                  setIsFollowing(false);
                  setFollowerCount((prev) => Math.max(0, prev - 1));
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(`following:${memberId}`, "0");
                  }
                  return;
                }
                const message =
                  err instanceof Error
                    ? err.message
                    : "팔로우/언팔로우에 실패했습니다.";
                alert(message);
              } finally {
                setFollowLoading(false);
              }
            }}
            className={
              isFollowing || followLoading
                ? "rounded-full bg-gray-200 px-5 py-2 text-[12px] font-semibold text-gray-500"
                : "rounded-full bg-black px-5 py-2 text-[12px] font-semibold text-white"
            }
          >
            {followLoading ? "처리 중..." : isFollowing ? "팔로잉" : "팔로우"}
          </button>
        )}
      </div>

      <div className="mx-auto w-full max-w-107.5">
        <ProfileSummary
          profile={profile}
          loading={false}
          stats={{
            postCount,
            followerCount,
            followingCount,
          }}
          onFollowerClick={() => {
            const nickname = profile?.nickname ?? "";
            router.push(
              `/profile/follows?tab=follower&nickname=${encodeURIComponent(
                nickname,
              )}&${followListQuery}`,
            );
          }}
          onFollowingClick={() => {
            const nickname = profile?.nickname ?? "";
            router.push(
              `/profile/follows?tab=following&nickname=${encodeURIComponent(
                nickname,
              )}&${followListQuery}`,
            );
          }}
        />
      </div>

      <ProfilePostGrid posts={posts} loading={postsLoading} />
      {postsHasMore && <div ref={observePosts} className="h-24" />}
    </div>
  );
}
