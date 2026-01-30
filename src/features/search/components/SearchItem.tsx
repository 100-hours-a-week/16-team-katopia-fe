import Link from "next/link";
import Image from "next/image";

type Props = {
  src: string;
  postId: number;
};

export default function SearchItem({ src, postId }: Props) {
  const hasImage = !!src && src.startsWith("http");
  return (
    <Link
      href={`/post/${postId}`}
      className="relative aspect-3/4 bg-gray-100 overflow-hidden block"
    >
      {hasImage ? (
        <Image
          src={src}
          alt="검색 이미지"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 33vw, 200px"
        />
      ) : null}
    </Link>
  );
}
