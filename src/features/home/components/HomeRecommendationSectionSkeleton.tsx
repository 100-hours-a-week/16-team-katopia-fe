export default function HomeRecommendationSectionSkeleton() {
  return (
    <section className="pt-4">
      {/* Suspense fallback: 추천 API 대기 중 레이아웃 점프를 줄이기 위한 스켈레톤 */}
      <div className="flex flex-col gap-2">
        <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-48 animate-pulse rounded bg-neutral-200" />
      </div>
      <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="flex min-w-55 flex-col items-center rounded-[22px] bg-[#f4f4f4] px-6 pb-6 pt-8"
          >
            <div className="h-[92px] w-[92px] animate-pulse rounded-full bg-neutral-200" />
            <div className="mt-4 h-4 w-20 animate-pulse rounded bg-neutral-200" />
            <div className="mt-2 h-4 w-24 animate-pulse rounded bg-neutral-200" />
            <div className="mt-1 h-4 w-28 animate-pulse rounded bg-neutral-200" />
            <div className="mt-5 h-12 w-full animate-pulse rounded-[14px] bg-neutral-200" />
          </div>
        ))}
      </div>
    </section>
  );
}
