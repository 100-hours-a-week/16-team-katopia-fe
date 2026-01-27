"use client";

import AppHeader from "@/src/shared/components/layout/AppHeader";

export default function VotePage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* 상단 영역 */}
      <AppHeader />

      {/* 메인 콘텐츠 (지금은 비워둠) */}
      <main className="flex-1 pt-14 flex items-center justify-center">
        <p className="text-center">다음 버전에서 만나요 ! :) </p>
      </main>
    </div>
  );
}
