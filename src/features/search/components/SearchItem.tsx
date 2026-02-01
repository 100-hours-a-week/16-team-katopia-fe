import Link from "next/link";
import Image from "next/image";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";

type Props = {
  src: string;
  postId: number;
};

export default function SearchItem({ src, postId }: Props) {
  const resolvedSrc = resolveMediaUrl(src);
  const hasImage = Boolean(resolvedSrc);
  return (
    <Link
      href={`/post/${postId}`}
      className="relative aspect-3/4 bg-gray-100 overflow-hidden block"
    >
      {hasImage ? (
        <Image
          src={resolvedSrc as string}
          alt="검색 이미지"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 33vw, 200px"
        />
      ) : null}
    </Link>
  );
}
