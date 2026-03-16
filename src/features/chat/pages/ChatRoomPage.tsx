"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MOCK_MESSAGES = [
  { id: 1, direction: "left" as const, width: "w-[42%]" },
  { id: 2, direction: "right" as const, width: "w-[40%]" },
  { id: 3, direction: "left" as const, width: "w-[42%]" },
  { id: 4, direction: "right" as const, width: "w-[40%]" },
  { id: 5, direction: "left" as const, width: "w-[43%]" },
  { id: 6, direction: "right" as const, width: "w-[41%]" },
];

type ChatRoomPageProps = {
  roomId: string;
  initialTitle?: string;
  initialMemberCount?: string;
  initialThumbnail?: string;
};

function ChatBubble({
  direction,
  width,
}: {
  direction: "left" | "right";
  width: string;
}) {
  const isRight = direction === "right";

  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
      <div
        className={`h-[80px] ${width} rounded-[20px] ${
          isRight ? "bg-[#cfcfcf]" : "bg-[#f1f1f1]"
        }`}
      />
    </div>
  );
}

export default function ChatRoomPage({
  roomId,
  initialTitle,
  initialMemberCount,
  initialThumbnail,
}: ChatRoomPageProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const menuAreaRef = useRef<HTMLDivElement>(null);
  const title = initialTitle?.trim() || "패션에 고민있는 사람 모여라!!!!!";
  const memberCount =
    Number(initialMemberCount) > 0 ? initialMemberCount : "15";
  const thumbnailSrc = initialThumbnail?.trim() || "/images/chat_default.png";

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuAreaRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed left-1/2 top-0 z-20 w-full max-w-[430px] -translate-x-1/2 border-b border-[#202020] bg-white">
        <div className="flex items-center gap-4 px-5 pb-4 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="뒤로 가기"
            className="flex h-10 w-10 shrink-0 items-center justify-center"
          >
            <Image src="/icons/back.svg" alt="" width={22} height={22} />
          </button>

          <div className="relative h-[66px] w-[72px] shrink-0 overflow-hidden bg-[#dddddd]">
            <Image
              src={thumbnailSrc}
              alt=""
              fill
              sizes="72px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold tracking-[-0.03em] text-[#111111]">
              {title}
            </p>
            <div className="mt-2 flex items-center gap-1 text-[13px] font-medium text-[#111111]">
              <Image src="/icons/user.svg" alt="" width={14} height={14} />
              <span className="leading-none">{memberCount}</span>
            </div>
          </div>

          <div ref={menuAreaRef} className="relative shrink-0">
            <button
              type="button"
              aria-label="채팅방 메뉴"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center"
            >
              <Image src="/icons/more.svg" alt="" width={18} height={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[42px] z-30 min-w-[88px] rounded-[14px] border border-[#d9d9d9] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setLeaveConfirmOpen(true);
                  }}
                  className="flex w-full items-center justify-center rounded-[10px] border border-[#ff4d4f] bg-[#fff1f1] px-3 py-2 text-[12px] font-medium text-[#ff4d4f] transition-colors hover:bg-[#ffe4e4]"
                >
                  나가기
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="px-6 pb-[calc(env(safe-area-inset-bottom)+132px)] pt-[126px]">
        <div className="space-y-20">
          {MOCK_MESSAGES.map((message) => (
            <ChatBubble
              key={`${roomId}-${message.id}`}
              direction={message.direction}
              width={message.width}
            />
          ))}
        </div>
      </main>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+18px)] pt-3">
        <label className="flex h-[72px] items-center rounded-[30px] border border-[#c5c5c5] bg-white px-6">
          <input
            type="text"
            placeholder="메세지 보내기.."
            className="w-full bg-transparent text-[14px] text-[#111111] outline-none placeholder:text-[#bdbdbd]"
          />
        </label>
      </div>

      {leaveConfirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-[320px] rounded-[28px] bg-white px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
            <p className="text-center text-[19px] font-semibold tracking-[-0.03em] text-[#111111]">
              채팅방에서 나가시겠어요?
            </p>
            <p className="mt-3 text-center text-[14px] leading-6 text-[#6a6a6a]">
              나가기를 선택하면 현재 채팅방 목록에서 사라집니다.
            </p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLeaveConfirmOpen(false)}
                className="h-12 rounded-[16px] border border-[#d5d5d5] text-[15px] font-medium text-[#111111]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setLeaveConfirmOpen(false);
                  window.alert(
                    "채팅방 나가기 기능은 아직 연결되지 않았습니다.",
                  );
                }}
                className="h-12 rounded-[16px] bg-[#ff4d4f] text-[15px] font-medium text-white"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
