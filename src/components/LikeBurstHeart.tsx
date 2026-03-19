"use client";

import Image from "next/image";

type LikeBurstHeartProps = {
  trigger: number;
  size?: number;
};

export default function LikeBurstHeart({
  trigger,
  size = 96,
}: LikeBurstHeartProps) {
  if (trigger <= 0) return null;

  return (
    <div
      key={trigger}
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
    >
      <Image
        src="/icons/heart_on.svg"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="animate-like-burst drop-shadow-[0_6px_18px_rgba(0,0,0,0.2)]"
      />
    </div>
  );
}
