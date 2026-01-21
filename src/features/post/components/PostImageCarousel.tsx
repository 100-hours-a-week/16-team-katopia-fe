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
import { MOCK_FEED } from "../data/mockFeed";

// 여기 이미지 움직이는데 왜 다른것도 다 렌더링이 계속 돼? 이거 고쳐야돼.

export default function PostImageCarousel() {
  const total = MOCK_FEED.images.length;

  const Indicators = () => {
    const { index, setIndex } = useCarousel();
    return (
      <div className="mt-2 flex justify-center gap-2">
        {MOCK_FEED.images.map((_, i) => (
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

  return (
    <Carousel className="mt-6">
      <CarouselContent>
        {MOCK_FEED.images.map((src, i) => (
          <CarouselItem key={i}>
            <div className="relative aspect-[3/4] bg-muted">
              <Image
                src={src}
                alt="게시물 이미지"
                fill
                className="object-cover"
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
      <Indicators />
    </Carousel>
  );
}
