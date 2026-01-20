// src/features/home/components/HomePage.tsx
"use client";

import HomeHeader from "./HomeHeader";
import LoginBottomSheet from "./LoginBottomsSheet";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* 상단 영역 */}
      <HomeHeader />

      {/* 메인 콘텐츠 (지금은 비워둠) */}
      <main className="flex-1 pt-14 flex items-center justify-center">
        <p className="text-center">다음 버전에서 만나요 ! :) </p>
      </main>

      {/* 하단 로그인 바텀시트 */}
      <LoginBottomSheet />
    </div>
  );
}
