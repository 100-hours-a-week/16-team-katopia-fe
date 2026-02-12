"use client";

import Avatar from "@/src/shared/components/Avatar";

type HomeRecommendationCardProps = {
  member: {
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
  return (
    <article className="flex min-w-55 flex-col items-center rounded-[22px] bg-[#f4f4f4] px-6 pb-6 pt-8 text-center">
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
        className="mt-5 w-full rounded-[14px] bg-black py-3 text-[14px] font-semibold text-white transition-transform duration-150 hover:scale-[1.06]"
      >
        팔로우
      </button>
    </article>
  );
}
