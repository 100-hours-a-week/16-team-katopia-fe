"use client";

import Image from "next/image";

import type { ChatTab } from "@/src/features/chat/types";

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5 text-[#202020]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

type ChatPageToolbarProps = {
  activeTab: ChatTab;
  searchQuery: string;
  onBack: () => void;
  onCreate: () => void;
  onSearchChange: (value: string) => void;
  onTabChange: (tab: ChatTab) => void;
};

export default function ChatPageToolbar({
  activeTab,
  searchQuery,
  onBack,
  onCreate,
  onSearchChange,
  onTabChange,
}: ChatPageToolbarProps) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로 가기"
        className="-ml-3 flex h-10 w-10 items-center justify-center"
      >
        <Image src="/icons/back.svg" alt="" width={22} height={22} />
      </button>

      <div className="flex items-center justify-between">
        <h1 className="mt-7 text-[26px] font-semibold tracking-[-0.04em] text-[#121212]">
          채팅
        </h1>
        <button
          type="button"
          aria-label="그룹 채팅방 만들기"
          data-testid="chat-create-button"
          onClick={onCreate}
          className="flex h-11 w-11 items-center justify-center rounded-full text-[#111111]"
        >
          <PlusIcon />
        </button>
      </div>

      <div className="mt-6 rounded-[20px] bg-[#f2f2f2] px-4 py-4">
        <label className="flex items-center gap-3">
          <SearchIcon />
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="찾으시는 채팅방 이름을 검색해주세요."
            className="w-full bg-transparent text-[14px] text-[#202020] outline-none placeholder:text-[#b8b8b8]"
          />
        </label>
      </div>

      <div className="mt-6 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => onTabChange("mine")}
          data-testid="chat-tab-mine"
          className={`rounded-full border px-4 py-2 text-[15px] font-medium leading-none transition-colors ${
            activeTab === "mine"
              ? "border-black bg-black text-white"
              : "border-[#101010] bg-white text-[#111111]"
          }`}
        >
          내 그룹채팅
        </button>
        <button
          type="button"
          onClick={() => onTabChange("open")}
          data-testid="chat-tab-open"
          className={`rounded-full border px-4 py-2 text-[15px] font-medium leading-none transition-colors ${
            activeTab === "open"
              ? "border-black bg-black text-white"
              : "border-[#101010] bg-white text-[#111111]"
          }`}
        >
          오픈그룹채팅
        </button>
      </div>
    </>
  );
}
