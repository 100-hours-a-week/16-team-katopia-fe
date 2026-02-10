"use client";

import Avatar from "@/src/shared/components/Avatar";
import Image from "next/image";

type HomePostHeaderProps = {
  author: {
    displayName: string;
    username: string;
    avatarUrl?: string | null;
  };
};

export default function HomePostHeader({ author }: HomePostHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar
          src={author.avatarUrl ?? null}
          alt={`${author.displayName} 프로필`}
          size={42}
          priority
        />
        <span className="text-[13px] font-semibold text-neutral-900">
          {author.displayName}
        </span>
      </div>
    </div>
  );
}
