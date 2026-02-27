"use client";

import { useRouter } from "next/navigation";
import Avatar from "@/src/shared/components/Avatar";

type HomePostHeaderProps = {
  author: {
    id: number;
    displayName: string;
    username: string;
    avatarUrl?: string | null;
  };
};

export default function HomePostHeader({ author }: HomePostHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => router.push(`/profile/${author.id}`)}
        className="flex items-center gap-3 text-left"
        aria-label={`${author.displayName} 프로필 보기`}
      >
        <Avatar
          src={author.avatarUrl ?? null}
          alt={`${author.displayName} 프로필`}
          size={42}
        />
        <span className="text-[13px] font-semibold text-neutral-900">
          {author.displayName}
        </span>
      </button>
    </div>
  );
}
