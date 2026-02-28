function SkeletonCard() {
  return (
    <article className="flex animate-pulse flex-col gap-4">
      <div className="h-6 w-44 rounded bg-neutral-200" />
      <div className="h-[72vw] max-h-[560px] w-full rounded bg-neutral-200" />
      <div className="h-5 w-36 rounded bg-neutral-200" />
      <div className="h-4 w-3/4 rounded bg-neutral-200" />
    </article>
  );
}

export default function HomeFeedSkeleton() {
  return (
    <section className="flex flex-col gap-10 pb-12">
      <SkeletonCard />
      <SkeletonCard />
    </section>
  );
}
