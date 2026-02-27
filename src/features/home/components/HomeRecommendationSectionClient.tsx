"use client";

import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import HomeRecommendationSection from "./HomeRecommendationSection";
import { useHomeRecommendations } from "@/src/features/home/hooks/useHomeRecommendations";
import type { HomeRecommendationMember } from "@/src/features/home/types/recommendation";

type HomeRecommendationSectionClientProps = {
  initialMembers: HomeRecommendationMember[];
};

export default function HomeRecommendationSectionClient({
  initialMembers,
}: HomeRecommendationSectionClientProps) {
  const { isAuthenticated } = useAuth();

  // 서버 시드가 비었을 때는 auth ready를 기다리지 않고 즉시 복구 fetch를 시작
  const fallbackMembers = useHomeRecommendations(
    isAuthenticated && initialMembers.length === 0,
  );

  const members = fallbackMembers.length > 0 ? fallbackMembers : initialMembers;

  return <HomeRecommendationSection members={members} />;
}
