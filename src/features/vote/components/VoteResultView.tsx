"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type VoteResultItem = {
  imageUrl: string;
  dislikePercent: number;
  dislikeCount: number;
  likePercent: number;
  likeCount: number;
};

type Props = {
  totalVotes?: number;
  items?: VoteResultItem[];
};

export default function VoteResultView({ totalVotes = 0, items = [] }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const CARD_WIDTH = 290;

  const handlePrev = () => {
    if (items.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    if (items.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const visibleItems = useMemo(() => {
    if (items.length === 0) return [];
    const prevIndex = (currentIndex - 1 + items.length) % items.length;
    const nextIndex = (currentIndex + 1) % items.length;
    return [
      { item: items[prevIndex], position: "left" as const },
      { item: items[currentIndex], position: "center" as const },
      { item: items[nextIndex], position: "right" as const },
    ];
  }, [currentIndex, items]);

  return (
    <div className="w-full max-w-90 text-left text-white">
      <p className="mt-7 mb-2 text-[20px] font-semibold">
        투표 결과
        <br />
        보여드릴게요
      </p>
      <p className="text-[15px] text-white/70">
        총 {totalVotes.toLocaleString()}표
      </p>

      <div className="mt-6">
        <div className="relative mx-auto h-110 w-full max-w-90 overflow-hidden">
          {visibleItems.map(({ item, position }) => {
            const isCenter = position === "center";
            const translateX =
              position === "left"
                ? -CARD_WIDTH * 0.45
                : position === "right"
                  ? CARD_WIDTH * 0.45
                  : 0;
            const rotate =
              position === "left" ? -6 : position === "right" ? 6 : 0;
            const scale = isCenter ? 1 : 0.88;
            const zIndex = isCenter ? 20 : 10;
            const translateY = isCenter ? 0 : 12; // 👈 살짝 깊이감

            return (
              <div
                key={position}
                className="absolute left-1/2 top-0 will-change-transform"
                style={{
                  transform: `translateX(calc(-50% + ${translateX}px)) translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                  zIndex,
                  width: CARD_WIDTH,
                  transition: "transform 720ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {position === "left" && (
                  <div className="pointer-events-none absolute -right-7 top-[28%] z-0 h-2 w-15 -translate-y-1/2 rotate-[-20deg] rounded-full bg-white/90" />
                )}
                {position === "right" && (
                  <div className="pointer-events-none absolute -left-7 top-[28%] z-0 h-2 w-15 -translate-y-1/2 rotate-20 rounded-full bg-white/90" />
                )}
                <div className="relative h-105 overflow-hidden rounded-[28px] bg-gray-200 shadow-[0_18px_40px_rgba(0,0,0,0.25)] transition-all duration-700 ease-out">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />

                  <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-black/40 px-5 py-4 text-white">
                    <div className="flex justify-between text-[12px]">
                      <div>
                        <p className="opacity-80">별로에요</p>
                        <p className="mt-1 text-[16px] font-semibold">
                          {item.dislikePercent}%
                        </p>
                        <p className="text-[11px] opacity-70">
                          {item.dislikeCount.toLocaleString()}표
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="opacity-80">좋아요</p>
                        <p className="mt-1 text-[16px] font-semibold">
                          {item.likePercent}%
                        </p>
                        <p className="text-[11px] opacity-70">
                          {item.likeCount.toLocaleString()}표
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6">
        <button onClick={handlePrev}>
          <Image
            src="/icons/arrow-left.svg"
            alt=""
            width={24}
            height={24}
            className="invert"
          />
        </button>
        <div className="flex gap-2">
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === currentIndex ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
        <button onClick={handleNext}>
          <Image
            src="/icons/arrow-right.svg"
            alt=""
            width={24}
            height={24}
            className="invert"
          />
        </button>
      </div>

      <button className="mt-6 h-12 w-full rounded-full bg-white text-[#121212] font-semibold">
        다른 투표 하러가기
      </button>
    </div>
  );
}
