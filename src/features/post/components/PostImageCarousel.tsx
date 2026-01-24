"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "@/components/ui/carousel";

type PostImageCarouselProps = {
  images: string[];
};

export default function PostImageCarousel({ images }: PostImageCarouselProps) {
  const total = images.length;

  const Indicators = () => {
    const { index, setIndex } = useCarousel();

    return (
      <div className="mt-2 flex justify-center gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 w-2 rounded-full transition ${
              i === index ? "bg-black" : "bg-gray-300"
            }`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    );
  };

  if (total === 0) return null;

  return (
    <Carousel className="mt-6">
      <CarouselContent>
        {images.map((src, i) => (
          <CarouselItem key={i}>
            <div className="relative aspect-[3/4] bg-muted">
              <Image
                src={src}
                alt={`게시물 이미지 ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority={i === 0}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* controls */}
      {total > 1 && (
        <>
          <CarouselPrevious />
          <CarouselNext />
        </>
      )}

      {/* dots */}
      {total > 1 && <Indicators />}
    </Carousel>
  );
}
