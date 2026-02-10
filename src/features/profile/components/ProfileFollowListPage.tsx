"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Avatar from "@/src/shared/components/Avatar";

type FollowTab = "follower" | "following";

const MOCK_LIST = Array.from({ length: 6 }).map((_, index) => ({
  id: `mock-${index + 1}`,
  name: "닉네임 1",
  avatarUrl: null as string | null,
}));

export default function ProfileFollowListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab =
    (searchParams.get("tab") as FollowTab | null) ?? "follower";
  const [activeTab, setActiveTab] = useState<FollowTab>(initialTab);

  const nickname = searchParams.get("nickname") ?? "닉네임";
  const followerCount = Number(searchParams.get("followers") ?? "0");
  const followingCount = Number(searchParams.get("following") ?? "0");

  const title = useMemo(() => nickname, [nickname]);

  return (
    <div className="min-h-screen bg-white px-4 py-4">
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-0"
        >
          <Image src="/icons/back.svg" alt="뒤로가기" width={20} height={20} />
        </button>
        <p className="text-[13px] font-semibold text-[#121212]">{title}</p>
      </div>

      <div className="mt-6 flex items-center justify-center gap-20 text-center">
        <button
          type="button"
          onClick={() => setActiveTab("follower")}
          className="flex flex-col items-center"
        >
          <p className="text-[12px] font-semibold text-[#121212]">
            {followerCount}
          </p>
          <p
            className={`mt-1 text-[12px] ${
              activeTab === "follower"
                ? "font-semibold text-[#121212] underline underline-offset-6"
                : "text-gray-500"
            }`}
          >
            팔로워
          </p>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("following")}
          className="flex flex-col items-center"
        >
          <p className="text-[13px] font-semibold text-[#121212]">
            {followingCount}
          </p>
          <p
            className={`mt-1 text-[12px] ${
              activeTab === "following"
                ? "font-semibold text-[#121212] underline underline-offset-6"
                : "text-gray-500"
            }`}
          >
            팔로잉
          </p>
        </button>
      </div>

      <ul className="mt-8 space-y-6">
        {MOCK_LIST.map((item) => (
          <li key={item.id} className="flex items-center gap-4">
            <Avatar
              src={item.avatarUrl}
              alt="profile"
              size={40}
              fallbackSrc="/icons/user.svg"
              fallbackSize={20}
              className="bg-gray-200"
            />
            <p className="text-[12px] font-semibold text-[#121212]">
              {item.name}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
