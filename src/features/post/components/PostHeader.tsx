"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MOCK_FEED } from "../data/mockFeed";

export default function PostHeader() {
  const router = useRouter();

  return (
    <div className="mb-4">
      {/* 상단 */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()}>
          <Image src="/icons/back.svg" alt="뒤로가기" width={24} height={24} />
        </button>
        <button>
          <Image src="/icons/more.svg" alt="더보기" width={20} height={20} />
        </button>
      </div>

      {/* 작성자 */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <Image src="/icons/user.svg" alt="유저" width={20} height={20} />
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold">{MOCK_FEED.nickname}</p>
          <p className="text-xs text-muted-foreground">
            {MOCK_FEED.height}cm {MOCK_FEED.weight}kg {MOCK_FEED.footSize}mm
          </p>
        </div>

        <p className="text-xs text-muted-foreground">{MOCK_FEED.createdAt}</p>
      </div>
    </div>
  );
}
