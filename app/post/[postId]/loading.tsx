function SkeletonBlock({
  className,
}: {
  className: string;
}) {
  return <div className={`animate-pulse rounded-md bg-neutral-200 ${className}`} />;
}

export default function PostDetailLoading() {
  return (
    <div className="min-h-screen px-2 py-4">
      <div className="mb-4">
        <div className="mb-8 flex items-center justify-between">
          <SkeletonBlock className="h-6 w-6 rounded-full" />
          <SkeletonBlock className="h-6 w-6 rounded-full" />
        </div>

        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </div>

      <SkeletonBlock className="aspect-[3/4] w-full rounded-xl" />

      <div className="mt-4 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <SkeletonBlock className="h-6 w-6 rounded-full" />
              <SkeletonBlock className="h-3 w-8" />
            </div>
            <div className="flex items-center gap-1.5">
              <SkeletonBlock className="h-6 w-6 rounded-full" />
              <SkeletonBlock className="h-3 w-8" />
            </div>
          </div>
          <SkeletonBlock className="h-6 w-6 rounded-sm" />
        </div>

        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-full" />
          <SkeletonBlock className="h-3 w-[84%]" />
          <SkeletonBlock className="h-3 w-[62%]" />
        </div>
      </div>

      <div className="mt-8 border-t pt-6">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-9 flex-1 rounded-full" />
          <SkeletonBlock className="h-9 w-14 rounded-full" />
        </div>

        <div className="mt-6 space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <SkeletonBlock className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-[72%]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
