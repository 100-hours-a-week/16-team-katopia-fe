"use client";

import Image from "next/image";

export default function VoteResultLoading() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-10 pt-28 text-center">
      <p className="text-[20px] font-semibold leading-snug text-white">
        투표 결과를
        <br />
        보여드릴게요
      </p>
      <div className="relative mt-2 flex items-center justify-center">
        <div className="absolute h-55 w-55 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.12)_35%,rgba(255,255,255,0)_70%)] blur-[2px]" />
        <Image
          src="/images/votebox.png"
          alt=""
          width={100}
          height={100}
          className="relative z-10 w-25 max-w-full animate-vote-float"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    </section>
  );
}
