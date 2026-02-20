"use client";

import HomeRecommendationCard from "./HomeRecommendationCard";
import type { HomeRecommendationMember } from "@/src/features/home/hooks/useHomeRecommendations";

type HomeRecommendationSectionProps = {
  members: HomeRecommendationMember[];
};

export default function HomeRecommendationSection({
  members,
}: HomeRecommendationSectionProps) {
  return (
    <section className="pt-4">
      <div className="flex flex-col gap-2">
        <p className="text-[15px] font-semibold text-neutral-900">
          회원님을 위한 추천
        </p>
        <p className="text-[13px] text-neutral-600">
          고객님과 비슷한 체형의 회원을 추천합니다.
        </p>
      </div>
      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {members.map((member) => (
          <HomeRecommendationCard key={member.id} member={member} />
        ))}
      </div>
    </section>
  );
}
