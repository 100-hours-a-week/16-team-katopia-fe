"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/src/shared/components/Avatar";

interface Props {
  nickname: string;
  userId?: string | number;
  profileImage?: string;
  searchQuery?: string;
}

function SearchAccountItem({
  nickname,
  profileImage,
  userId,
  searchQuery,
}: Props) {
  const router = useRouter();

  const handleClick = () => {
    if (!userId) return;
    const params = new URLSearchParams();
    params.set("tab", "account");
    if (searchQuery) params.set("q", searchQuery);
    router.push(`/profile/${userId}?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center gap-4 py-3 text-left"
    >
      <Avatar
        src={profileImage}
        alt={nickname || "기본 프로필"}
        size={40}
        fallbackSrc="/icons/profile.svg"
        fallbackSize={20}
        fallbackClassName="opacity-60"
      />

      <span className="text-sm font-medium">{nickname}</span>
    </button>
  );
}

export default memo(SearchAccountItem);
