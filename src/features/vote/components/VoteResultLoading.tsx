"use client";

export default function VoteResultLoading() {
  return (
    <section className="w-full max-w-90 text-left text-white">
      <div className="mt-7 space-y-2">
        <div className="h-6 w-44 rounded-full bg-white/20" />
        <div className="h-6 w-36 rounded-full bg-white/20" />
        <div className="h-4 w-24 rounded-full bg-white/10" />
      </div>

      <div className="mt-6">
        <div className="relative mx-auto h-110 w-full max-w-90 overflow-hidden perspective-distant">
          <div className="absolute left-1/2 top-0 -translate-x-1/2">
            <div className="h-105 w-[290px] rounded-[28px] bg-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.25)]">
              <div className="h-full w-full animate-pulse rounded-[28px] bg-gradient-to-br from-white/10 via-white/5 to-white/10" />
            </div>
          </div>
          <div className="absolute left-1/2 top-0 -translate-x-[70%] translate-y-3 scale-[0.88] opacity-80">
            <div className="h-105 w-[290px] rounded-[28px] bg-white/5" />
          </div>
          <div className="absolute left-1/2 top-0 -translate-x-[30%] translate-y-3 scale-[0.88] opacity-80">
            <div className="h-105 w-[290px] rounded-[28px] bg-white/5" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="h-6 w-6 rounded-full bg-white/10" />
        <div className="flex gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        </div>
        <div className="h-6 w-6 rounded-full bg-white/10" />
      </div>

      <div className="mt-8 flex justify-center">
        <div className="h-14 w-full max-w-55 rounded-full bg-white/15" />
      </div>
    </section>
  );
}
