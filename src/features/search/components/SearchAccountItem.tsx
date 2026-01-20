"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  nickname: string;
  userId?: string | number;
  profileImage?: string;
}

function SearchAccountItem({ nickname, profileImage, userId }: Props) {
  return (
    <Link
      href={userId ? `/profile/${userId}` : "#"}
      className="flex items-center gap-4 py-3"
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
            className="opacity-60"
          />
        )}
      </div>

      <span className="text-sm font-medium">{nickname}</span>
    </Link>
  );
}

export default memo(SearchAccountItem);
