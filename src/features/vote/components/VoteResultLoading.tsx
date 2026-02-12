"use client";

export default function VoteResultLoading() {
  return (
    <section className="flex flex-col items-center justify-center gap-10 pt-24 text-center">
      <p className="text-[20px] font-semibold leading-snug text-white">
        투표 결과를
        <br />
        보여드릴게요
      </p>
      <div className="relative flex items-center justify-center">
        <div className="absolute h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.12)_35%,rgba(255,255,255,0)_70%)] blur-[2px]" />
        <img
          src="/images/votebox.png"
          alt=""
          className="relative z-10 w-[100px] max-w-full animate-vote-float"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    </section>
  );
}
