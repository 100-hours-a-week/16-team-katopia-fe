"use client";

import AppHeader from "@/src/shared/components/layout/AppHeader";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import HomeFeed from "./HomeFeed";
import HomeRecommendationSection, {
  type HomeRecommendationMember,
} from "./HomeRecommendationSection";
import HomeInfoCarousel from "./HomeInfoCarousel";
import { useInfiniteHomeFeed } from "../hooks/useInfiniteHomeFeed";
import { getHomeMembers } from "../api/getHomeMembers";

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { ready, isAuthenticated } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restoreAttemptedRef = useRef(false);
  const pendingScrollYRef = useRef<number | null>(null);
  const isActiveState = searchParams.get("STATE") === "ACTIVE";
  const isPendingSignup = searchParams.get("status") === "PENDING";
  const feedEnabled = ready && isAuthenticated;
  const [recommendations, setRecommendations] = useState<
    HomeRecommendationMember[]
  >([]);

  const {
    items: posts,
    hasMore: postsHasMore,
    observe: observePosts,
  } = useInfiniteHomeFeed({
    size: 10,
    enabled: feedEnabled,
  });

  useEffect(() => {
    if (!feedEnabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecommendations([]);
      return;
    }
    let cancelled = false;

    const fetchRecommendations = async () => {
      try {
        const data = await getHomeMembers();
        if (cancelled) return;
        const mapped = (data.members ?? []).map((member) => ({
          id: member.id,
          name: member.nickname ?? "",
          heightCm: member.height ?? 0,
          weightKg: member.weight ?? 0,
          styles: member.styles ?? [],
          avatarUrl: member.profileImageUrl ?? null,
        }));
        setRecommendations(mapped);
      } catch {
        if (cancelled) return;
        setRecommendations([]);
      }
    };

    fetchRecommendations();
    return () => {
      cancelled = true;
    };
  }, [feedEnabled]);

  useEffect(() => {
    if (!isActiveState) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("STATE");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [isActiveState, pathname, router, searchParams]);

  useEffect(() => {
    if (!isPendingSignup) return;
    router.replace("/signup/step1");
  }, [isPendingSignup, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const message = window.localStorage.getItem("katopia.signupWelcome");
      if (!message) return;
      window.localStorage.removeItem("katopia.signupWelcome");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToastMessage(message);
      toastTimerRef.current = setTimeout(() => {
        setToastMessage(null);
      }, 1200);
    } catch {
      // ignore storage errors
    }
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = "katopia.home.scrollY";
    const readScroll = () => {
      try {
        const stored = window.sessionStorage.getItem(key);
        if (!stored) return null;
        const y = Number(stored);
        return Number.isFinite(y) ? y : null;
      } catch {
        return null;
      }
    };

    pendingScrollYRef.current = readScroll();

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const saveScroll = () => {
      try {
        window.sessionStorage.setItem(key, String(window.scrollY));
      } catch {
        // ignore storage errors
      }
    };
    const onScroll = () => {
      saveScroll();
    };
    const onPageHide = () => {
      saveScroll();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveScroll();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      try {
        window.sessionStorage.setItem(key, String(window.scrollY));
      } catch {
        // ignore storage errors
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (restoreAttemptedRef.current) return;
    const targetY = pendingScrollYRef.current;
    if (targetY == null) return;

    let tries = 0;
    const maxTries = 40;
    let intervalId: number | null = null;

    const attempt = () => {
      const doc = document.documentElement;
      const canScroll = doc.scrollHeight >= targetY + window.innerHeight - 20;

      if (canScroll || tries >= maxTries) {
        window.scrollTo(0, targetY);
        restoreAttemptedRef.current = true;
        if (intervalId != null) {
          window.clearInterval(intervalId);
        }
        return;
      }

      tries += 1;
      requestAnimationFrame(attempt);
    };

    requestAnimationFrame(attempt);
    intervalId = window.setInterval(attempt, 200);
    const onLoad = () => attempt();
    window.addEventListener("load", onLoad);
    return () => {
      if (intervalId != null) {
        window.clearInterval(intervalId);
      }
      window.removeEventListener("load", onLoad);
    };
  }, [posts.length]);

  return (
    <>
      <div className="relative min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 px-6 pb-12 pt-16">
          <HomeInfoCarousel />
          <HomeFeed posts={posts} />
          {feedEnabled && postsHasMore && (
            <div ref={observePosts} className="h-24" />
          )}
          <HomeRecommendationSection members={recommendations} />
        </main>

        {toastMessage && (
          <div className="fixed bottom-25 left-1/2 z-100 -translate-x-1/2 px-4">
            <div
              className="min-w-65 rounded-full bg-white px-8 py-3 text-center text-base font-semibold text-[#121212] shadow-lg"
              style={{ animation: "toastFadeIn 250ms ease-out forwards" }}
            >
              {toastMessage}
            </div>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes toastFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
