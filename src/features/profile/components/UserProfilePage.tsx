"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { getMemberPosts } from "../api/getMemberPosts";
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

  const [posts, setPosts] = useState<{ id: number; imageUrl: string }[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsCursor, setPostsCursor] = useState<string | null>(null);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [lastLoadScrollY, setLastLoadScrollY] = useState(0);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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

  const loadMorePosts = useCallback(() => {
    if (Number.isNaN(memberId) || postsLoading || !postsHasMore) {
      return;
    }

    setPostsLoading(true);

    getMemberPosts({
      memberId,
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
  }, [memberId, postsCursor, postsHasMore, postsLoading]);

  // member 변경 시 초기화
  useEffect(() => {
    setPosts([]);
    setPostsCursor(null);
    setPostsHasMore(true);
    setHasScrolled(false);
    setLastLoadScrollY(0);
  }, [memberId]);

  // 최초 1페이지 로딩
  useEffect(() => {
    if (!Number.isNaN(memberId)) {
      loadMorePosts();
    }
  }, [memberId, loadMorePosts]);

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

      {/* ⭐ sentinel은 반드시 높이를 줘야 함 */}
      <div ref={sentinelRef} className="h-24" />
    </div>
  );
}
