"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginBottomSheet() {
  const router = useRouter();

  const handleKakaoLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/oauth/kakao`;
  };

  // 🔧 임시 프로필 설정 버튼 (개발용)
  const handleTempProfileSetup = () => {
    router.push("/signup/step1");
  };

  return (
    <Sheet defaultOpen>
      <SheetContent
        side="bottom"
        className="
          rounded-t-2xl
          px-6 pb-10
          w-full max-w-[390px] mx-auto
          min-h-[40vh]
          flex flex-col justify-center
        "
      >
        <div className="space-y-4 text-center">
          <SheetTitle className="text-lg font-semibold">
            로그인이 필요합니다.
          </SheetTitle>

          <p className="text-sm text-muted-foreground">
            패션에 진심인 SNS에 참여하세요.
          </p>

          <Button
            onClick={handleKakaoLogin}
            className="
              w-full
              h-14
              mt-8
              text-base
              font-semibold
              bg-[#FEE500]
              text-black
              hover:bg-[#FEE500]/90
              rounded-xl
              flex items-center justify-center gap-2
            "
          >
            <Image src="/icons/chat.svg" alt="카카오" width={20} height={20} />
            카카오로 시작하기
          </Button>
          {/* 🔧 임시 버튼 (개발용) */}
          <Button
            variant="outline"
            onClick={handleTempProfileSetup}
            className="
              w-full
              h-12
              text-sm
              text-muted-foreground
              border-dashed
            "
          >
            (임시) 프로필 설정 화면 미리보기
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// 1. 로그인 성공 시 BottomSheet 닫기, 실패 시 Toast 메세지 알림
// 2. Zustand Auth 연결
// 3. 카카오 OAuth 버튼 실제 동작 연결3. 카카오 OAuth 버튼 실제 동작 연결
