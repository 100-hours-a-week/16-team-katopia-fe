"use client";

import AppHeader from "@/src/shared/components/layout/AppHeader";
import LoginBottomSheet from "./LoginBottomsSheet";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 pt-14 flex items-center justify-center">
        <p className="text-center">다음 버전에서 만나요 ! :) </p>
      </main>

      <LoginBottomSheet />
    </div>
  );
}
