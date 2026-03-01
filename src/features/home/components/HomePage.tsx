"use client";

import AppHeader from "@/src/shared/components/layout/AppHeader";
import { useHomeQuerySync } from "../hooks/useHomeQuerySync";
import { useSignupWelcomeToast } from "../hooks/useSignupWelcomeToast";

export default function HomePage({
  children,
  feed,
  recommendation,
}: {
  children?: React.ReactNode;
  feed?: React.ReactNode;
  recommendation?: React.ReactNode;
}) {
  const toastMessage = useSignupWelcomeToast();

  useHomeQuerySync();

  return (
    <>
      <div className="relative min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 px-1 pb-12 pt-16">
          {/* <HomeInfoCarousel /> */}
          {feed}
          {recommendation}
          {children}
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
