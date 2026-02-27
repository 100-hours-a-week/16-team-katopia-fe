"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "@/components/ui/carousel";

type HomePostMediaProps = {
  postId: number;
  imageUrl?: string | null;
  imageUrls?: string[];
};

export default function HomePostMedia({
  postId,
  imageUrl,
  imageUrls,
}: HomePostMediaProps) {
  const router = useRouter();

  const images = useMemo(() => {
    const list = imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : [];
    return list.filter(Boolean);
  }, [imageUrl, imageUrls]);

  const hasImages = images.length > 0;
  const hasMultiple = images.length > 1;
  const total = images.length;

  const Indicators = () => {
    const { index } = useCarousel();
    return (
      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
        {images.map((_, idx) => (
          <span
            key={idx}
            className={`h-1.5 w-1.5 rounded-full ${
              idx === index ? "bg-white" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    );
  };

  if (!hasImages) {
    return (
      <div
        className="relative aspect-3/4 w-full overflow-hidden rounded-[6px] bg-[#d9d9d9]"
        aria-label="게시물 이미지"
      />
    );
  }

  return (
    <Carousel className="relative aspect-3/4 w-full overflow-hidden rounded-[6px] bg-[#efefef]">
      <CarouselContent className="h-full">
        {images.map((src, i) => (
          <CarouselItem key={i} className="h-full">
            <button
              type="button"
              onClick={() => router.push(`/post/${postId}`)}
              className="relative block h-full w-full"
              aria-label="게시물 이미지"
            >
              <Image
                src={src}
                alt={`게시물 이미지 ${i + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-cover"
              />
            </button>
          </CarouselItem>
        ))}
      </CarouselContent>

      {hasMultiple && (
        <>
          <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[11px] text-white">
            <CarouselCount total={total} />
          </div>
          <CarouselPrevious />
          <CarouselNext />
          <Indicators />
        </>
      )}
    </Carousel>
  );
}

function CarouselCount({ total }: { total: number }) {
  const { index } = useCarousel();
  return (
    <>
      {index + 1}/{total}
    </>
  );
}
