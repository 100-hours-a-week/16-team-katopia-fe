"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { useInfinitePostGrid } from "@/src/features/search/hooks/useInfinitePostGrid";
import ProfilePostGrid from "./ProfilePostGrid";
import ProfileSummary from "./ProfileSummary";

interface Props {
  userId: string;
}

/* ================= 타입 ================= */

type ApiProfile = {
  nickname: string;
  profileImageUrl: string | null;
  gender: "M" | "F" | null;
  heightCm: number | null;
  weightKg: number | null;
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
  const searchParams = useSearchParams();
  const memberId = Number(userId);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    items: posts,
    loading: postsLoading,
    hasMore: postsHasMore,
    observe: observePosts,
  } = useInfinitePostGrid({
    memberId,
    size: 30,
    mode: "member",
  });

  /* ================= 프로필 ================= */

  useEffect(() => {
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

        setProfile({
          nickname: apiProfile.nickname,
          profileImageUrl: apiProfile.profileImageUrl,
          gender:
            apiProfile.gender === "M"
              ? "male"
              : apiProfile.gender === "F"
                ? "female"
                : null,
          height: apiProfile.heightCm,
          weight: apiProfile.weightKg,
          style: apiProfile.style ?? [],
        });
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [memberId]);

  /* ================= 게시글 ================= */

  /* ================= UI ================= */

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
          const q = searchParams.get("q");
          const tab = searchParams.get("tab") ?? "account";
          const qs = new URLSearchParams();
          if (tab) qs.set("tab", tab);
          if (q) qs.set("q", q);
          router.push(`/search?${qs.toString()}`);
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
