"use client";

import Image from "next/image";

type HomePostMediaProps = {
  imageUrl?: string | null;
};

export default function HomePostMedia({ imageUrl }: HomePostMediaProps) {
  if (!imageUrl) {
    return (
      <div
        className="aspect-[3/4] w-full rounded-[6px] bg-[#d9d9d9]"
        aria-label="게시물 이미지"
      />
    );
  }

  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[6px] bg-[#efefef]">
      <Image
        src={imageUrl}
        alt="게시물 이미지"
        fill
        sizes="(max-width: 768px) 100vw, 480px"
        className="object-cover"
      />
    </div>
  );
}
