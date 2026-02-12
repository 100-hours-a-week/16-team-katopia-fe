"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/src/shared/components/Avatar";
import { followMember } from "@/src/features/profile/api/followMember";
import { unfollowMember } from "@/src/features/profile/api/unfollowMember";

type HomeRecommendationCardProps = {
  member: {
    id: number;
    name: string;
    heightCm: number;
    weightKg: number;
    styles: string[];
    avatarUrl?: string | null;
  };
};

export default function HomeRecommendationCard({
  member,
}: HomeRecommendationCardProps) {
  const router = useRouter();
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/profile/${member.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/profile/${member.id}`);
        }
      }}
      className="flex min-w-55 cursor-pointer flex-col items-center rounded-[22px] bg-[#f4f4f4] px-6 pb-6 pt-8 text-center"
    >
      <Avatar
        src={member.avatarUrl ?? null}
        alt={`${member.name} 프로필`}
        size={92}
        priority
        className="border border-[#d7d7d7]"
      />
      <p className="mt-4 text-[14px] font-semibold text-neutral-900">
        {member.name}
      </p>
      <p className="mt-2 text-[13px]  text-neutral-900">
        {member.heightCm}cm {member.weightKg}kg
      </p>
      <p className="mt-1 text-[13px] text-neutral-700">
        {member.styles.join(", ")}
      </p>
      <button
        type="button"
        disabled={followLoading}
        onClick={async (event) => {
          event.stopPropagation();
          if (followLoading) return;
          setFollowLoading(true);
          try {
            if (isFollowing) {
              await unfollowMember(member.id);
              setIsFollowing(false);
            } else {
              await followMember(member.id);
              setIsFollowing(true);
            }
          } finally {
            setFollowLoading(false);
          }
        }}
        className={
          followLoading
            ? "mt-5 w-full rounded-[14px] bg-gray-200 py-3 text-[14px] font-semibold text-gray-500"
            : isFollowing
              ? "mt-5 w-full rounded-[14px] border  bg-gray-200 py-3 text-[14px] font-semibold text-gray-500"
              : "mt-5 w-full rounded-[14px] bg-black py-3 text-[14px] font-semibold text-white transition-transform duration-150 "
        }
      >
        {isFollowing ? "팔로잉" : "팔로우"}
      </button>
    </article>
  );
}
