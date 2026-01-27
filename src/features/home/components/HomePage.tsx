"use client";

import AppHeader from "@/src/shared/components/layout/AppHeader";
import LoginBottomSheet from "./LoginBottomsSheet";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, ready } = useAuth();
  const isActiveState = searchParams.get("STATE") === "ACTIVE";

  useEffect(() => {
    if (!isActiveState) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("STATE");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [isActiveState, pathname, router, searchParams]);

  return (
    <div className="relative min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 pt-14 flex items-center justify-center">
        <p className="text-center">다음 버전에서 만나요 ! :) </p>
      </main>

      {ready && !isAuthenticated && <LoginBottomSheet />}
    </div>
  );
}
