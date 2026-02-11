"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
import { useOptimisticPostCount } from "@/src/features/profile/hooks/useOptimisticPostCount";

type Profile = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  gender: "male" | "female" | null;
  height: number | null;
  weight: number | null;
  style: string[];
};

function BookmarkIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M6 4.5h12a1 1 0 0 1 1 1v15l-7-4-7 4v-15a1 1 0 0 1 1-1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const [activeTab, setActiveTab] = useState<"posts" | "bookmarks">("posts");

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
  const optimisticPostCount = useOptimisticPostCount(posts.length);

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
        // console.log("[profile] /api/members/me response", {
        //   profileImageObjectKey: json?.data?.profile?.profileImageObjectKey,
        //   profileImageUrl: json?.data?.profile?.profileImageUrl,
        // });
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
        setProfile({
          userId,
          ...rawProfile,
          gender: normalizedGender,
          profileImageUrl: profileImageKey ?? null,
          height: rawProfile.height,
          weight: rawProfile.weight,
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

        <ProfileSummary
          profile={profile}
          loading={loading}
          stats={{
            postCount: optimisticPostCount,
            followerCount: 0,
            followingCount: 0,
          }}
          onFollowerClick={() => {
            const nickname = profile?.nickname ?? "";
            router.push(
              `/profile/follows?tab=follower&nickname=${encodeURIComponent(
                nickname,
              )}&followers=0&following=0`,
            );
          }}
          onFollowingClick={() => {
            const nickname = profile?.nickname ?? "";
            router.push(
              `/profile/follows?tab=following&nickname=${encodeURIComponent(
                nickname,
              )}&followers=0&following=0`,
            );
          }}
        />

        <div className="mt-6 border-b border-gray-200 px-8">
          <div className="flex items-center justify-center gap-24">
            <button
              type="button"
              onClick={() => setActiveTab("posts")}
              className="relative flex h-12 w-12 items-center justify-center text-black"
              aria-pressed={activeTab === "posts"}
            >
              <Image
                src="/icons/grid.png"
                alt="게시물"
                width={28}
                height={28}
                className={activeTab === "posts" ? "opacity-100" : "opacity-40"}
              />
              {activeTab === "posts" && (
                <span className="absolute bottom-0 h-[2px] w-8 bg-black" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bookmarks")}
              className="relative flex h-12 w-12 items-center justify-center text-black"
              aria-pressed={activeTab === "bookmarks"}
            >
              <span
                className={
                  activeTab === "bookmarks" ? "opacity-100" : "opacity-40"
                }
              >
                <BookmarkIcon active={activeTab === "bookmarks"} />
              </span>
              {activeTab === "bookmarks" && (
                <span className="absolute bottom-0 h-[2px] w-8 bg-black" />
              )}
            </button>
          </div>
        </div>

        {activeTab === "posts" && (
          <>
            <ProfilePostGrid
              posts={posts}
              loading={postsLoading}
              detailQuery="from=profile"
            />
            {postsHasMore && <div ref={observePosts} className="h-24" />}
          </>
        )}

        {activeTab === "bookmarks" && (
          <div className="flex min-h-[280px] items-center justify-center text-sm text-gray-500">
            북마크한 게시물이 없어요.
          </div>
        )}
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
