"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProfileHeader from "./ProfileHeader";
import ProfileSummary from "./ProfileSummary";
import ProfilePostGrid from "./ProfilePostGrid";
import ProfileWithdrawModal from "./ProfileWithdrawModal";
import ProfileLogoutModal from "./ProfileLogoutModal";
import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { getMemberPosts } from "../api/getMemberPosts";
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
  const [posts, setPosts] = useState<{ id: number; imageUrl: string }[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsCursor, setPostsCursor] = useState<string | null>(null);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const postsObserverRef = useRef<IntersectionObserver | null>(null);
  const postsSentinelRef = useRef<HTMLDivElement | null>(null);

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

        // console.log(res);

        if (!res.ok) {
          console.log((await res.json()).code);
          throw new Error("내 정보 조회 실패");
        }

        const json = await res.json();
        const rawProfile = json.data.profile;
        const userId = json.data.id; // ✅ 여기
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

        console.log(userId);

        setProfile({
          userId, // ✅ 저장
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
  }, [isAuthenticated, ready, searchParams, searchParams.toString()]);

  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated) return;
    router.replace("/home");
  }, [isAuthenticated, ready, router]);

  const loadMorePosts = useCallback(() => {
    if (!profile?.userId || postsLoading || !postsHasMore) return;
    setPostsLoading(true);
    getMemberPosts({
      memberId: profile.userId,
      size: 30,
      after: postsCursor ?? undefined,
    })
      .then((data) => {
        const mapped = data.posts
          .map((post) => ({
            id: post.id,
            imageUrl: post.imageUrl,
          }))
          .filter((post) => !!post.imageUrl);

        setPosts((prev) => {
          const map = new Map<number, { id: number; imageUrl: string }>();
          prev.forEach((item) => map.set(item.id, item));
          mapped.forEach((item) => map.set(item.id, item));
          return Array.from(map.values());
        });
        setPostsCursor(data.nextCursor ?? null);
        setPostsHasMore(!!data.nextCursor);
      })
      .catch(() => {
        setPostsHasMore(false);
      })
      .finally(() => setPostsLoading(false));
  }, [profile?.userId, postsLoading, postsHasMore, postsCursor]);

  useEffect(() => {
    setPosts([]);
    setPostsCursor(null);
    setPostsHasMore(true);
  }, [profile?.userId]);

  useEffect(() => {
    if (!profile?.userId) return;
    loadMorePosts();
  }, [profile?.userId, loadMorePosts]);

  useEffect(() => {
    if (!postsHasMore) return;
    const node = postsSentinelRef.current;
    if (!node) return;
    postsObserverRef.current?.disconnect();
    postsObserverRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 0.4 },
    );
    postsObserverRef.current.observe(node);
    return () => postsObserverRef.current?.disconnect();
  }, [postsHasMore, loadMorePosts]);

  const handleToggleMenu = () => setMenuOpen((prev) => !prev);
  const handleCloseMenu = () => setMenuOpen(false);
  const handleOpenWithdraw = () => setWithdrawOpen(true);
  const handleCloseWithdraw = () => setWithdrawOpen(false);
  const handleOpenLogout = () => setLogoutOpen(true);
  const handleCloseLogout = () => setLogoutOpen(false);

  if (!ready || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        <ProfileHeader
          menuOpen={menuOpen}
          onToggleMenu={handleToggleMenu}
          onCloseMenu={handleCloseMenu}
          onLogout={handleOpenLogout}
          onWithdraw={handleOpenWithdraw}
        />

        {/* ✅ 데이터 내려줌 */}
        <ProfileSummary profile={profile} loading={loading} />

        <ProfilePostGrid
          posts={posts}
          loading={postsLoading}
          detailQuery="from=profile"
        />
        <div ref={postsSentinelRef} />
      </div>

      <ProfileWithdrawModal
        open={withdrawOpen}
        onClose={handleCloseWithdraw}
        onConfirm={() => {
          handleCloseWithdraw();
        }}
      />

      <ProfileLogoutModal open={logoutOpen} onClose={handleCloseLogout} />
    </>
  );
}
