"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

type HomePostMediaProps = {
  postId: number;
  imageUrl?: string | null;
};

export default function HomePostMedia({ postId, imageUrl }: HomePostMediaProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/post/${postId}`)}
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-[6px] ${
        imageUrl ? "bg-[#efefef]" : "bg-[#d9d9d9]"
      }`}
      aria-label="게시물 이미지"
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt="게시물 이미지"
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-cover"
        />
      )}
    </button>
  );
}
