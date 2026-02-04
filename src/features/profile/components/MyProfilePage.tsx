"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProfileHeader from "./ProfileHeader";
import ProfileSummary from "./ProfileSummary";
import ProfilePostGrid from "./ProfilePostGrid";
import ProfileWithdrawModal from "./ProfileWithdrawModal";
import ProfileLogoutModal from "./ProfileLogoutModal";
import { API_BASE_URL } from "@/src/config/api";
import { authFetch, clearAccessToken, setLoggedOutFlag } from "@/src/lib/auth";
import { useInfinitePostGrid } from "@/src/features/search/hooks/useInfinitePostGrid";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { withdrawMember } from "@/src/features/profile/api/withdrawMember";

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
  const searchParamsKey = searchParams.toString();
  const { ready, isAuthenticated, setAuthenticated } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawRedirecting, setWithdrawRedirecting] = useState(false);

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
    mode: "member",
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
        console.log("[profile] /api/members/me response", {
          profileImageObjectKey: json?.data?.profile?.profileImageObjectKey,
          profileImageUrl: json?.data?.profile?.profileImageUrl,
        });
        const rawProfile = json.data.profile;
        const userId = json.data.id;

        const normalizedGender =
          rawProfile.gender === "M" || rawProfile.gender === "MALE"
            ? "male"
            : rawProfile.gender === "F" || rawProfile.gender === "FEMALE"
              ? "female"
              : null;

        const profileImageKey =
          rawProfile.profileImageObjectKey ?? rawProfile.profileImageUrl;
        let locallyRemoved = false;
        try {
          locallyRemoved =
            window.localStorage.getItem("katopia.profileImageRemoved") === "1";
        } catch {
          locallyRemoved = false;
        }
        const resolvedProfileImageKey = locallyRemoved ? null : profileImageKey;

        setProfile({
          userId,
          ...rawProfile,
          gender: normalizedGender,
          profileImageUrl: resolvedProfileImageKey ?? null,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [ready, isAuthenticated, searchParamsKey]);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated && !withdrawRedirecting) {
      router.replace("/home");
    }
  }, [ready, isAuthenticated, router, withdrawRedirecting]);

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
        confirmDisabled={withdrawing}
        confirmLabel={withdrawing ? "처리 중..." : "확인"}
        onConfirm={async () => {
          if (withdrawing) return;
          setWithdrawing(true);
          try {
            await withdrawMember();
            setWithdrawRedirecting(true);
            setWithdrawOpen(false);
            router.replace("/withdraw/success");
            clearAccessToken();
            setLoggedOutFlag(true);
            setAuthenticated(false);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "회원 탈퇴에 실패했습니다.";
            alert(message);
          } finally {
            setWithdrawing(false);
          }
        }}
      />

      <ProfileLogoutModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
      />
    </>
  );
}
