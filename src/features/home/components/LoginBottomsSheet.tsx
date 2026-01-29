"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { KAKAO_OAUTH_URL } from "@/src/config/api";
import { setLoggedOutFlag } from "@/src/lib/auth";

type Props = {
  persist?: boolean;
};

export default function LoginBottomSheet({ persist = false }: Props) {
  const handleKakaoLogin = () => {
    setLoggedOutFlag(false);
    window.location.href = KAKAO_OAUTH_URL;
  };

  return (
    <Sheet
      open={persist ? true : undefined}
      defaultOpen={!persist}
      onOpenChange={persist ? () => {} : undefined}
    >
      <SheetContent
        side="bottom"
        showClose={!persist}
        onEscapeKeyDown={persist ? (e) => e.preventDefault() : undefined}
        onInteractOutside={persist ? (e) => e.preventDefault() : undefined}
        className="
          rounded-t-2xl
          px-6 pb-10
          w-full max-w-97.5 mx-auto
          min-h-[40vh]
          flex flex-col justify-center
          bg-[#fefefe]
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
