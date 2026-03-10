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
  onRefresh?: () => void;
  showRefresh?: boolean;
  cardWidth?: number;
  cardHeight?: number;
};

export default function VoteResultView({
  totalVotes = 0,
  items = [],
  onRefresh,
  showRefresh = true,
  cardWidth = 340,
  cardHeight = 500,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

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
    return items
      .map((item, itemIndex) => {
        let relative = itemIndex - currentIndex;
        const half = items.length / 2;

        if (relative > half) relative -= items.length;
        if (relative < -half) relative += items.length;

        return { item, itemIndex, relative };
      })
      .filter(({ relative }) => Math.abs(relative) <= 1)
      .sort((a, b) => a.relative - b.relative);
  }, [currentIndex, items]);

  return (
    <div
      className="w-full text-left text-white"
      style={{ maxWidth: cardWidth + 80 }}
    >
      <p className="mt-7 mb-2 text-[20px] font-semibold">
        투표 결과
        <br />
        보여드릴게요
      </p>
      <p className="text-[15px] text-white/70">
        총 {totalVotes.toLocaleString()}표
      </p>

      <div className="mt-6">
        <div
          className="relative mx-auto w-full overflow-hidden perspective-distant"
          style={{ height: cardHeight + 40, maxWidth: cardWidth + 80 }}
        >
          {visibleItems.map(({ item, itemIndex, relative }) => {
            const safeSrc = item.imageUrl || "/images/logo.png";
            const isCenter = relative === 0;
            const translateX =
              relative < 0
                ? -cardWidth * 0.45
                : relative > 0
                  ? cardWidth * 0.45
                  : 0;
            const rotateZ =
              relative < 0 ? -4 : relative > 0 ? 4 : 0;
            const rotateY = 0;
            const scale = isCenter ? 1 : 0.88;
            const zIndex = isCenter ? 20 : 10;
            const translateY = isCenter ? 0 : 12;
            const translateZ = isCenter ? 0 : -100;
            const opacity = isCenter ? 1 : 0.85;

            return (
              <div
                key={itemIndex}
                className="absolute left-1/2 top-0 will-change-transform transform-3d"
                style={{
                  transform: `translateX(calc(-50% + ${translateX}px)) translateY(${translateY}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                  zIndex,
                  width: cardWidth,
                  opacity,
                  transition:
                    "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 320ms ease-out",
                  backfaceVisibility: "hidden",
                }}
              >
                {relative < 0 && (
                  <div className="pointer-events-none absolute -right-7 top-[28%] z-0 h-2 w-15 -translate-y-1/2 rotate-[-20deg] rounded-full bg-white/90" />
                )}
                {relative > 0 && (
                  <div className="pointer-events-none absolute -left-7 top-[28%] z-0 h-2 w-15 -translate-y-1/2 rotate-20 rounded-full bg-white/90" />
                )}
                <div
                  className="relative overflow-hidden rounded-[28px] bg-gray-200 shadow-[0_18px_40px_rgba(0,0,0,0.25)] transition-all duration-700 ease-out"
                  style={{ height: cardHeight }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={safeSrc}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src.endsWith("/images/logo.png")) return;
                      target.src = "/images/logo.png";
                    }}
                  />

                  <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-black/40 px-5 py-4 text-white">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[20px] font-semibold">
                          {item.likePercent}%
                        </p>
                        <p className="mt-1 text-[15px] opacity-80">
                          {item.likeCount.toLocaleString()}표
                        </p>
                      </div>
                      <div className="text-right text-[14px] opacity-80">
                        <p>득표율</p>
                        <p className="mt-1">득표수</p>
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

      {showRefresh && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onRefresh}
            className="flex h-14 w-full max-w-72 items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-black"
          >
            <Image
              src="/icons/refresh.svg"
              alt="다른 투표 불러오기"
              width={20}
              height={20}
              className="h-5 w-5"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
            다른 투표 하러가기
          </button>
        </div>
      )}
    </div>
  );
}
