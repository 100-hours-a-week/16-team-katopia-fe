"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProfileHeader from "./ProfileHeader";
import ProfileSummary from "./ProfileSummary";
import ProfilePostGrid from "./ProfilePostGrid";
import ProfileWithdrawModal from "./ProfileWithdrawModal";
import ProfileLogoutModal from "./ProfileLogoutModal";
import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { useInfinitePostGrid } from "@/src/features/search/hooks/useInfinitePostGrid";
import {
  getCachedProfileImage,
  setCachedProfileImage,
} from "@/src/features/profile/utils/profileImageCache";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";

type Profile = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  gender: "male" | "female" | null;
  height: number | null;
  weight: number | null;
  style: string[];
};

export default function MyProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, isAuthenticated } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    items: posts,
    loading: postsLoading,
    hasMore: postsHasMore,
    observe: observePosts,
  } = useInfinitePostGrid({
    memberId: profile?.userId,
    size: 30,
  });

  /* -------------------------
     내 정보 조회
  ------------------------- */
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
        const userId = json.data.id;

        const normalizedGender =
          rawProfile.gender === "M" || rawProfile.gender === "MALE"
            ? "male"
            : rawProfile.gender === "F" || rawProfile.gender === "FEMALE"
              ? "female"
              : null;

        if (rawProfile.profileImageUrl) {
          setCachedProfileImage(rawProfile.profileImageUrl);
        }

        const cachedImage = getCachedProfileImage();

        setProfile({
          userId,
          ...rawProfile,
          gender: normalizedGender,
          profileImageUrl: rawProfile.profileImageUrl ?? cachedImage,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [ready, isAuthenticated, searchParams.toString()]);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace("/home");
    }
  }, [ready, isAuthenticated, router]);

  /* -------------------------
     게시글 로딩
  ------------------------- */
  /* -------------------------
     UI
  ------------------------- */
  if (!ready || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        <ProfileHeader
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((prev) => !prev)}
          onCloseMenu={() => setMenuOpen(false)}
          onLogout={() => setLogoutOpen(true)}
          onWithdraw={() => setWithdrawOpen(true)}
        />

        <ProfileSummary profile={profile} loading={loading} />

        <ProfilePostGrid
          posts={posts}
          loading={postsLoading}
          detailQuery="from=profile"
        />

        {postsHasMore && <div ref={observePosts} className="h-24" />}
      </div>

      <ProfileWithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={() => {
          setWithdrawOpen(false);
        }}
      />

      <ProfileLogoutModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
      />
    </>
  );
}
