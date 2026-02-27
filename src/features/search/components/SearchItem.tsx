import Link from "next/link";
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
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedSrc}
            alt="검색 이미지"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </>
      )}
    </Link>
  );
}
