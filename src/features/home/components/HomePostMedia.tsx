"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Image from "next/image";

type HomePostMediaProps = {
  postId: number;
  imageUrl?: string | null;
  imageUrls?: string[];
  prioritizeFirstImage?: boolean;
};

export default function HomePostMedia({
  postId,
  imageUrl,
  imageUrls,
  prioritizeFirstImage = false,
}: HomePostMediaProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const images = useMemo(() => {
    const list = imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : [];
    return list.filter(Boolean);
  }, [imageUrl, imageUrls]);

  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;
  const total = images.length;
  const safeIndex = hasImages ? Math.min(index, total - 1) : 0;

  if (!hasImages) {
    return (
      <div
        className="relative aspect-3/4 overflow-hidden rounded-[6px] bg-[#d9d9d9]"
        aria-label="게시물 이미지"
      />
    );
  }

  return (
    <div className="relative aspect-3/4 overflow-hidden rounded-[6px] bg-[#efefef]">
      <div
        className="flex h-full w-full transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: `translate3d(-${safeIndex * 100}%, 0, 0)` }}
      >
        {images.map((src, imageIndex) => (
          <div key={imageIndex} className="h-full w-full shrink-0">
            <button
              type="button"
              onClick={() => router.push(`/post/${postId}?from=home`)}
              className="relative block h-full w-full"
              aria-label="게시물 이미지"
            >
              <Image
                src={src}
                alt={`게시물 이미지 ${imageIndex + 1}`}
                fill
                sizes="(max-width: 430px) 100vw, 430px"
                className="object-cover"
                priority={prioritizeFirstImage && imageIndex === 0}
                fetchPriority={
                  prioritizeFirstImage && imageIndex === 0 ? "high" : "auto"
                }
                loading={
                  prioritizeFirstImage && imageIndex === 0 ? "eager" : "lazy"
                }
                quality={70}
              />
            </button>
          </div>
        ))}
      </div>

      {hasMultiple && (
        <>
          <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[11px] text-white">
            {safeIndex + 1}/{total}
          </div>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setIndex((prev) => (prev - 1 + total) % total)}
            className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white shadow backdrop-blur-sm ring-1 ring-white/10 transition hover:bg-black/55 active:scale-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/chevron-left.svg"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 invert"
            />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setIndex((prev) => (prev + 1) % total)}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white shadow backdrop-blur-sm ring-1 ring-white/10 transition hover:bg-black/55 active:scale-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/chevron-right.svg"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 invert"
            />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
            {images.map((_, dotIndex) => (
              <span
                key={dotIndex}
                className={`h-1.5 w-1.5 rounded-full ${
                  dotIndex === safeIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
