"use client";

import Image from "next/image";

import type { ChatRoom } from "@/src/features/chat/types";

type ChatRoomCardProps = {
  room: ChatRoom;
  onClick?: () => void;
};

export default function ChatRoomCard({ room, onClick }: ChatRoomCardProps) {
  const isMine = room.category === "mine";
  const isOpen = room.category === "open";

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isMine
          ? "relative w-full rounded-[30px] bg-[#f6f6f6] px-6 py-5 text-left transition-colors hover:bg-[#f0f0f0]"
          : isOpen
            ? "w-full bg-[#f3f3f3] px-6 pb-5 pt-5 text-center transition-colors hover:bg-[#ededed]"
            : "relative w-full transform-gpu rounded-[22px] border border-[#1a1a1a] bg-white px-5 py-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-[transform,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[2px] hover:scale-[1.003] hover:bg-[#fcfcfc] hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)] active:translate-y-0 active:scale-[0.998]"
      }
      style={
        isOpen
          ? {
              borderTopLeftRadius: "45px",
              borderBottomLeftRadius: "40px",
              borderTopRightRadius: "0px",
              borderBottomRightRadius: "45px",
            }
          : undefined
      }
    >
      {isMine ? (
        <div className="flex items-center gap-4 pr-10">
          <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full bg-[#dddddd]">
            <Image
              src={room.thumbnailImageUrl || "/images/chat_default.png"}
              alt=""
              fill
              sizes="52px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-[1.3] tracking-[-0.03em] text-[#111111]">
              {room.title}
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 text-[15px] font-medium text-[#111111]">
              <Image src="/icons/user.svg" alt="" width={16} height={16} />
              <span className="leading-none">{room.memberCount}</span>
            </div>
          </div>
        </div>
      ) : null}
      {isOpen && (
        <div className="mx-auto flex w-fit items-center justify-center gap-3">
          <div className="relative h-[50px] w-[50px] overflow-hidden rounded-full bg-[#dddddd]">
            <Image
              src={room.thumbnailImageUrl || "/images/chat_default.png"}
              alt=""
              fill
              sizes="50px"
              className="object-cover"
            />
          </div>
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#111111]">
            <Image src="/icons/user.svg" alt="" width={12} height={12} />
            <span className="leading-none">{room.memberCount}</span>
          </div>
        </div>
      )}
      <p
        className={
          isMine
            ? "hidden"
            : isOpen
              ? "mt-6 text-[15px] font-semibold leading-[1.32] tracking-[-0.03em] text-[#111111]"
              : "pr-8 text-[14px] font-semibold leading-[1.35] text-[#111111]"
        }
      >
        {room.title}
      </p>
      {!isOpen && !isMine && (
        <div
          className={
            isMine
              ? "mt-2.5 flex items-center gap-1.5 text-[15px] font-medium text-[#111111]"
              : "mt-3 flex items-center gap-1 text-[13px] font-medium text-[#1c1c1c]"
          }
        >
          <Image
            src="/icons/user.svg"
            alt=""
            width={isMine ? 16 : 13}
            height={isMine ? 16 : 13}
          />
          <span className="leading-none">{room.memberCount}</span>
        </div>
      )}
      {typeof room.unreadCount === "number" && room.unreadCount > 0 && (
        <span
          className={
            isMine
              ? "absolute right-6 top-1/2 flex h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#111111] px-1.5 text-[11px] font-semibold text-white"
              : "absolute right-4 top-1/2 flex h-6 min-w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#111111] px-1.5 text-[11px] font-semibold text-white"
          }
        >
          {room.unreadCount > 99 ? "99+" : room.unreadCount}
        </span>
      )}
    </button>
  );
}
