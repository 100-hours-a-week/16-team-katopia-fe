"use client";

import { memo, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/src/shared/components/Avatar";
import { followMember } from "@/src/features/profile/api/followMember";

interface Props {
  nickname: string;
  userId?: string | number;
  profileImage?: string;
  searchQuery?: string;
  isFollowing?: boolean;
  onFollowed?: (userId: number | string) => void;
}

function SearchAccountItem({
  nickname,
  profileImage,
  userId,
  searchQuery,
  isFollowing = false,
  onFollowed,
}: Props) {
  const router = useRouter();
  const [followLoading, setFollowLoading] = useState(false);

  const handleClick = () => {
    if (!userId) return;
    const params = new URLSearchParams();
    params.set("tab", "account");
    if (searchQuery) params.set("q", searchQuery);
    router.push(`/profile/${userId}?${params.toString()}`);
  };

  return (
    <div className="flex w-full items-center gap-4 py-3">
      <button
        type="button"
        onClick={handleClick}
        className="flex flex-1 items-center gap-4 text-left"
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

      {!isFollowing && (
        <button
          type="button"
          disabled={followLoading}
          onClick={async () => {
            if (!userId || followLoading) return;
            setFollowLoading(true);
            try {
              await followMember(userId);
              onFollowed?.(userId);
            } finally {
              setFollowLoading(false);
            }
          }}
          className={
            followLoading
              ? "rounded-full bg-gray-200 px-4 py-1.5 text-[12px] font-semibold text-gray-500"
              : "rounded-full bg-black px-4 py-1.5 text-[12px] font-semibold text-white"
          }
        >
          팔로우
        </button>
      )}
    </div>
  );
}

export default memo(SearchAccountItem);
