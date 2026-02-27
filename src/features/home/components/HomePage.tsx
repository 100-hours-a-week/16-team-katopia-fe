"use client";

import AppHeader from "@/src/shared/components/layout/AppHeader";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import HomeFeed from "./HomeFeed";
import HomeRecommendationSection from "./HomeRecommendationSection";
import { useInfiniteHomeFeed } from "../hooks/useInfiniteHomeFeed";
import { useHomeRecommendations } from "../hooks/useHomeRecommendations";
import { useHomeQuerySync } from "../hooks/useHomeQuerySync";
import { useSignupWelcomeToast } from "../hooks/useSignupWelcomeToast";
import { useHomeScrollRestoration } from "../hooks/useHomeScrollRestoration";

export default function HomePage() {
  const { ready, isAuthenticated } = useAuth();
  const feedEnabled = ready && isAuthenticated;
  const toastMessage = useSignupWelcomeToast();
  const recommendations = useHomeRecommendations(feedEnabled);

  useHomeQuerySync();

  const {
    items: posts,
    hasMore: postsHasMore,
    observe: observePosts,
  } = useInfiniteHomeFeed({
    size: 10,
    enabled: feedEnabled,
  });

  useHomeScrollRestoration(posts.length);

  return (
    <>
      <div className="relative min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 px-1 pb-12 pt-16">
          {/* <HomeInfoCarousel /> */}
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
