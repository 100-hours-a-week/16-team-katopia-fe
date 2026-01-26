import Link from "next/link";

type Props = {
  src: string;
  postId: number;
};

export default function SearchItem({ src, postId }: Props) {
  const hasImage = !!src && src.startsWith("http");
  return (
    <Link
      href={`/post/${postId}`}
      className="relative aspect-[3/4] bg-gray-100 overflow-hidden block"
    >
      {hasImage ? (
        <img
          src={src}
          alt="검색 이미지"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : null}
    </Link>
  );
}
