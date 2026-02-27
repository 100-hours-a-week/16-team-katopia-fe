import Link from "next/link";
import Image from "next/image";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";

type Props = {
  src: string;
  postId: number;
};

export default function SearchItem({ src, postId }: Props) {
  const resolvedSrc = resolveMediaUrl(src);

  return (
    <Link
      href={`/post/${postId}`}
      prefetch={false}
      className="relative aspect-3/4 bg-gray-100 overflow-hidden block"
    >
      {resolvedSrc && (
        <Image
          src={resolvedSrc}
          alt="검색 이미지"
          fill
          sizes="(max-width: 768px) 33vw, 200px"
          className="object-cover"
          loading="lazy"
          quality={70}
        />
      )}
    </Link>
  );
}
