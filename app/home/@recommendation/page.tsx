import { Suspense } from "react";
import HomeRecommendationSectionServer from "@/src/features/home/components/HomeRecommendationSectionServer";
import HomeRecommendationSectionSkeleton from "@/src/features/home/components/HomeRecommendationSectionSkeleton";

export default function HomeRecommendationSlotPage() {
  return (
    <Suspense fallback={<HomeRecommendationSectionSkeleton />}>
      <HomeRecommendationSectionServer revalidateSeconds={60} />
    </Suspense>
  );
}
