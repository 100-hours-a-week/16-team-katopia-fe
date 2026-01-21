"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { MOCK_USERS } from "../data/mockUsers";

interface Props {
  userId: string;
}

export default function UserProfilePage({ userId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const numericId = Number(userId);
  const user =
    (!Number.isNaN(numericId) && MOCK_USERS.find((u) => u.id === numericId)) ||
    MOCK_USERS.find((u) => u.nickname === userId);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        사용자를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-4">
      {/* 헤더 */}
      <button
        onClick={() => {
          const q = searchParams.get("q");
          const tab = searchParams.get("tab") ?? "account";
          const qs = new URLSearchParams();
          if (tab) qs.set("tab", tab);
          if (q) qs.set("q", q);
          router.push(`/search?${qs.toString()}`);
        }}
      >
        <Image src="/icons/back.svg" alt="뒤로가기" width={24} height={24} />
      </button>

      {/* 프로필 정보 */}
      <div className="mt-8 flex flex-col items-center">
        <div className="relative h-24 w-24 rounded-full bg-muted flex items-center justify-center">
          {user.profileImage ? (
            <Image
              src={user.profileImage}
              alt={user.nickname}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <Image
              src="/icons/user.svg"
              alt="기본 프로필"
              width={32}
              height={32}
            />
          )}
        </div>

        <p className="mt-4 font-semibold">
          {user.nickname} ({user.gender})
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          {user.height}cm&nbsp;&nbsp;
          {user.weight}kg&nbsp;&nbsp;
        </p>
      </div>

      {/* 게시물 그리드 */}
      <div className="mt-10 grid grid-cols-3 gap-2">
        {user.posts.map((src, idx) => (
          <div key={idx} className="relative aspect-3/4 bg-muted">
            <Image src={src} alt="게시물" fill className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
