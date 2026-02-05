"use client";

import Image from "next/image";
import AppHeader from "@/src/shared/components/layout/AppHeader";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveState = searchParams.get("STATE") === "ACTIVE";
  const isPendingSignup = searchParams.get("status") === "PENDING";

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

  return (
    <>
      <div className="relative min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 pt-14 px-6 flex items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/icons/notfile2.svg"
              alt=""
              width={100}
              height={100}
              className="grayscale"
            />
            <p className="mt-6 text-[16px] font-semibold text-[#121212]">
              피드가 텅 비었어요!
            </p>
            <p className="mt-2 text-[13px] leading-5 text-gray-500">
              검색 탭에서 새로운 게시물을 만나보세요.
            </p>
          </div>
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
