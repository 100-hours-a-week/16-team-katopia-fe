"use client";

import { memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

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
      <div className="relative h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
        {profileImage ? (
          <Image
            src={profileImage}
            alt={nickname}
            fill
            className="object-cover"
          />
        ) : (
          <Image
            src="/icons/profile.svg"
            alt="기본 프로필"
            width={20}
            height={20}
            className="h-auto w-auto opacity-60"
          />
        )}
      </div>

      <span className="text-sm font-medium">{nickname}</span>
    </button>
  );
}

export default memo(SearchAccountItem);
