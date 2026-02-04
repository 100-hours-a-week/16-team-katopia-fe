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

/* ================= 페이지 ================= */

export default function UserProfilePage({ userId }: Props) {
  const router = useRouter();
  const memberId = Number(userId);
  const { ready, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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

    authFetch(`${API_BASE_URL}/api/members/me`, {
      method: "GET",
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const id = json?.data?.id;
        if (typeof id === "number") {
          setCurrentUserId(id);
        }
      })
      .catch(() => {});
  }, [ready, isAuthenticated]);

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
        const apiProfile: ApiProfile | undefined = json.data?.profile;

        if (!apiProfile) {
          setProfile(null);
          return;
        }

        let height = apiProfile.heightCm ?? apiProfile.height ?? null;
        let weight = apiProfile.weightKg ?? apiProfile.weight ?? null;
        if (currentUserId != null && currentUserId === memberId) {
          try {
            const heightRemoved =
              window.localStorage.getItem("katopia.profileHeightRemoved") ===
              "1";
            const weightRemoved =
              window.localStorage.getItem("katopia.profileWeightRemoved") ===
              "1";
            if (heightRemoved) height = null;
            if (weightRemoved) weight = null;
          } catch {
            // ignore storage errors
          }
        }

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
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [memberId, ready, isAuthenticated, currentUserId]);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace("/home");
    }
  }, [ready, isAuthenticated, router]);

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
      {/* 뒤로가기 */}
      <button
        onClick={() => {
          router.back();
        }}
      >
        <Image src="/icons/back.svg" alt="뒤로가기" width={24} height={24} />
      </button>

      <ProfileSummary profile={profile} loading={false} />

      <ProfilePostGrid posts={posts} loading={postsLoading} />
      {postsHasMore && <div ref={observePosts} className="h-24" />}
    </div>
  );
}
