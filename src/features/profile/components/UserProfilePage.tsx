"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { useInfinitePostGrid } from "@/src/features/search/hooks/useInfinitePostGrid";
import ProfilePostGrid from "./ProfilePostGrid";
import ProfileSummary from "./ProfileSummary";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { followMember } from "@/src/features/profile/api/followMember";
import { unfollowMember } from "@/src/features/profile/api/unfollowMember";

interface Props {
  userId: string;
}

/* ================= 타입 ================= */

type ApiProfile = {
  nickname: string;
  profileImageUrl: string | null;
  profileImageObjectKey?: string | null;
  gender: "M" | "F" | null;
  heightCm?: number | null;
  weightKg?: number | null;
  height?: number | null;
  weight?: number | null;
  style?: string[] | null;
};

type UserProfile = {
  nickname: string;
  profileImageUrl: string | null;
  gender: "male" | "female" | null;
  height: number | null;
  weight: number | null;
  style?: string[] | null;
};

type ApiAggregate = {
  postCount?: number | null;
  followerCount?: number | null;
  followingCount?: number | null;
};

/* ================= 페이지 ================= */

export default function UserProfilePage({ userId }: Props) {
  const router = useRouter();
  const memberId = Number(userId);
  const { ready, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const {
    items: posts,
    loading: postsLoading,
    hasMore: postsHasMore,
    observe: observePosts,
  } = useInfinitePostGrid({
    memberId,
    size: 30,
    mode: "member",
    enabled: ready && isAuthenticated,
  });

  /* ================= 프로필 ================= */

  useEffect(() => {
    if (!ready || !isAuthenticated) return;
    if (Number.isNaN(memberId)) return;

    const fetchProfile = async () => {
      try {
        const res = await authFetch(`${API_BASE_URL}/api/members/${memberId}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) throw new Error("프로필 조회 실패");

        const json = await res.json();
        console.log("[profile] /api/members/{id} response", json);
        const apiProfile: ApiProfile | undefined = json.data?.profile;
        const apiIsFollowingRaw =
          json.data?.isFollowing ??
          json.data?.followed ??
          json.data?.isFollow ??
          json.data?.following ??
          json.data?.profile?.isFollowing ??
          json.data?.profile?.followed ??
          json.data?.profile?.isFollow ??
          json.data?.profile?.following;
        const apiAggregate: ApiAggregate | undefined =
          json.data?.aggregate ?? json.aggregate;

        if (!apiProfile) {
          setProfile(null);
          return;
        }

        const height = apiProfile.heightCm ?? apiProfile.height ?? null;
        const weight = apiProfile.weightKg ?? apiProfile.weight ?? null;

        setProfile({
          nickname: apiProfile.nickname,
          profileImageUrl:
            apiProfile.profileImageObjectKey ?? apiProfile.profileImageUrl,
          gender:
            apiProfile.gender === "M"
              ? "male"
              : apiProfile.gender === "F"
                ? "female"
                : null,
          height,
          weight,
          style: apiProfile.style ?? [],
        });

        setPostCount(Number(apiAggregate?.postCount ?? 0) || 0);
        setFollowerCount(Number(apiAggregate?.followerCount ?? 0) || 0);
        setFollowingCount(Number(apiAggregate?.followingCount ?? 0) || 0);

        if (typeof apiIsFollowingRaw === "boolean") {
          setIsFollowing(apiIsFollowingRaw);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              `following:${memberId}`,
              apiIsFollowingRaw ? "1" : "0",
            );
          }
        } else if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem(`following:${memberId}`);
          if (stored === "1") setIsFollowing(true);
          if (stored === "0") setIsFollowing(false);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [memberId, ready, isAuthenticated]);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace("/home");
    }
  }, [ready, isAuthenticated, router]);

  useEffect(() => {
    if (posts.length === 0) return;
    setPostCount((prev) => (prev > posts.length ? prev : posts.length));
  }, [posts.length]);

  /* ================= 게시글 ================= */

  /* ================= UI ================= */

  if (!ready || !isAuthenticated) {
    return null;
  }

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
      </div>

      <div className="mx-auto w-full max-w-97.5">
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
              )}&followers=${followerCount}&following=${followingCount}&memberId=${memberId}`,
            );
          }}
          onFollowingClick={() => {
            const nickname = profile?.nickname ?? "";
            router.push(
              `/profile/follows?tab=following&nickname=${encodeURIComponent(
                nickname,
              )}&followers=${followerCount}&following=${followingCount}&memberId=${memberId}`,
            );
          }}
        />
      </div>

      <ProfilePostGrid posts={posts} loading={postsLoading} />
      {postsHasMore && <div ref={observePosts} className="h-24" />}
    </div>
  );
}
