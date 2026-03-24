"use client";

import { memo } from "react";
import Image from "next/image";

type ChatRoomHeaderProps = {
  roomTitle: string;
  roomThumbnailSrc: string;
  roomMemberCount: number;
  resolvedIsOwner: boolean;
  menuOpen: boolean;
  onBack: () => void;
  onToggleMenu: () => void;
  onOpenEdit: () => void;
  onOpenDelete: () => void;
  onOpenLeave: () => void;
};

function ChatRoomHeader({
  roomTitle,
  roomThumbnailSrc,
  roomMemberCount,
  resolvedIsOwner,
  menuOpen,
  onBack,
  onToggleMenu,
  onOpenEdit,
  onOpenDelete,
  onOpenLeave,
}: ChatRoomHeaderProps) {
  return (
    <header className="fixed left-1/2 top-0 z-20 w-full max-w-[430px] -translate-x-1/2 bg-white shadow-[0_10px_14px_-12px_rgba(17,17,17,0.28)]">
      <div className="flex items-center gap-4 px-5 pb-4 pt-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로 가기"
          className="flex h-10 w-10 shrink-0 items-center justify-center"
        >
          <Image src="/icons/back.svg" alt="" width={22} height={22} />
        </button>
        <div className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-full bg-[#dddddd]">
          <Image
            src={roomThumbnailSrc}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-[-0.03em] text-[#111111]">
            {roomTitle}
          </p>
          <div className="mt-2 flex items-center gap-1 text-[13px] font-medium text-[#111111]">
            <Image src="/icons/user.svg" alt="" width={14} height={14} />
            <span className="leading-none">{roomMemberCount}</span>
          </div>
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="채팅방 메뉴"
            onClick={onToggleMenu}
            className="flex h-10 w-10 items-center justify-center"
          >
            <Image src="/icons/more.svg" alt="" width={18} height={18} />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-[42px] z-30 min-w-[82px] overflow-hidden rounded-[14px] border border-[#1f1f1f] bg-white shadow-[0_10px_22px_rgba(0,0,0,0.08)]">
              {resolvedIsOwner ? (
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={onOpenEdit}
                    className="flex h-9 w-full items-center justify-center bg-white text-[13px] font-medium text-[#111111] transition-colors hover:bg-[#f4f4f4]"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={onOpenDelete}
                    className="flex h-9 w-full items-center justify-center border-t border-[#1f1f1f] bg-[#fff1f1] text-[13px] font-medium text-[#ff4d4f] transition-colors hover:bg-[#ffe7e7]"
                  >
                    삭제
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLeave}
                  className="flex w-full items-center justify-center rounded-[10px] border border-[#ff4d4f] bg-[#fff1f1] px-3 py-2 text-[12px] font-medium text-[#ff4d4f]"
                >
                  나가기
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

const MemoizedChatRoomHeader = memo(ChatRoomHeader);

MemoizedChatRoomHeader.displayName = "ChatRoomHeader";

export default MemoizedChatRoomHeader;
