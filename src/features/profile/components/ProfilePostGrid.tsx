import Image from "next/image";
import Link from "next/link";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";

type ProfilePostGridProps = {
  posts: {
    id: number;
    imageUrl: string;
  }[];
  loading?: boolean;
  detailQuery?: string;
};

export default function ProfilePostGrid({
  posts,
  loading,
  detailQuery,
}: ProfilePostGridProps) {
  if (loading && posts.length === 0) {
    return (
      <div className="mt-6 grid grid-cols-3 gap-2 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-3/4 rounded bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-gray-500">게시물이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-3 gap-2 px-4">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={
            detailQuery ? `/post/${post.id}?${detailQuery}` : `/post/${post.id}`
          }
          prefetch={false}
          className="relative aspect-3/4 overflow-hidden bg-gray-100"
        >
          {resolveMediaUrl(post.imageUrl) && (
            <Image
              src={resolveMediaUrl(post.imageUrl) as string}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, 200px"
              placeholder="empty"
            />
          )}
        </Link>
      ))}

      {loading &&
        Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`loading-${i}`}
            className="aspect-3/4 rounded bg-gray-200 animate-pulse"
          />
        ))}
    </div>
  );
}
