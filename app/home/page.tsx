import { Suspense } from "react";
import HomePage from "@/src/features/home/components/HomePage";
import HomeRecommendationSectionServer from "@/src/features/home/components/HomeRecommendationSectionServer";
import HomeRecommendationSectionSkeleton from "@/src/features/home/components/HomeRecommendationSectionSkeleton";

export default function Home() {
  return (
    <HomePage>
      {/* 추천 섹션은 서버에서 비동기로 가져오고, 준비 전에는 스켈레톤 노출 */}
      <Suspense fallback={<HomeRecommendationSectionSkeleton />}>
        <HomeRecommendationSectionServer revalidateSeconds={60} />
      </Suspense>
    </HomePage>
  );
}
