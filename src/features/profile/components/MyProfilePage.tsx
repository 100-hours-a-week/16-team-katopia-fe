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
  const [hasScrolled, setHasScrolled] = useState(false);
  const [lastLoadScrollY, setLastLoadScrollY] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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
  const loadMorePosts = useCallback(() => {
    if (!profile?.userId || postsLoading || !postsHasMore) {
      return;
    }

    setPostsLoading(true);

    getMemberPosts({
      memberId: profile.userId,
      size: 30,
      after: postsCursor ?? undefined,
    })
      .then((data) => {
        const mapped = data.posts
          .filter((p) => p.imageUrl)
          .map((p) => ({
            id: p.id,
            imageUrl: p.imageUrl,
          }));

        // 🔒 id 기준 중복 제거
        setPosts((prev) => {
          const map = new Map<number, { id: number; imageUrl: string }>();
          prev.forEach((item) => map.set(item.id, item));
          mapped.forEach((item) => map.set(item.id, item));
          return Array.from(map.values());
        });

        if (data.nextCursor === postsCursor) {
          setPostsHasMore(false);
        } else {
          setPostsCursor(data.nextCursor ?? null);
          setPostsHasMore(Boolean(data.nextCursor));
        }
        setLastLoadScrollY(window.scrollY);
      })
      .catch(() => {
        setPostsHasMore(false);
      })
      .finally(() => {
        setPostsLoading(false);
      });
  }, [profile?.userId, postsCursor, postsHasMore, postsLoading]);

  // 프로필 변경 시 초기화
  useEffect(() => {
    setPosts([]);
    setPostsCursor(null);
    setPostsHasMore(true);
    setHasScrolled(false);
    setLastLoadScrollY(0);
  }, [profile?.userId]);

  // 최초 1페이지 로딩
  useEffect(() => {
    if (profile?.userId) {
      loadMorePosts();
    }
  }, [profile?.userId, loadMorePosts]);

  // 사용자 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) setHasScrolled(true);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver
  useEffect(() => {
    if (!postsHasMore || postsLoading) return;

    const node = sentinelRef.current;
    if (!node) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          hasScrolled &&
          window.scrollY > lastLoadScrollY + 10
        ) {
          loadMorePosts();
        }
      },
      {
        root: null,
        rootMargin: "200px", // ⭐ 바닥 근처에서만 미리 로딩
        threshold: 0,
      },
    );

    observerRef.current.observe(node);

    return () => observerRef.current?.disconnect();
  }, [postsHasMore, postsLoading, loadMorePosts, hasScrolled, lastLoadScrollY]);

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

        {/* ⭐ 반드시 높이 있는 sentinel */}
        <div ref={sentinelRef} className="h-24" />
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
