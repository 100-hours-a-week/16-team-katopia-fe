import Link from "next/link";
import { memo, useMemo } from "react";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";

type ProfilePostGridProps = {
  posts: {
    id: number;
    imageUrl: string;
  }[];
  loading?: boolean;
  detailQuery?: string;
};

function ProfilePostGrid({
  posts,
  loading,
  detailQuery,
}: ProfilePostGridProps) {
  const resolvedPosts = useMemo(
    () =>
      posts
        .map((post) => ({
          ...post,
          resolvedImageUrl: resolveMediaUrl(post.imageUrl),
        }))
        .filter((post) => Boolean(post.resolvedImageUrl)),
    [posts],
  );

  if (loading && posts.length === 0) {
    return (
      <div className="mt-6 grid grid-cols-3 gap-0.5 ">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-3/4 rounded bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (resolvedPosts.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-gray-500">게시물이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-3 gap-0.5 ">
      {resolvedPosts.map((post, index) => (
        <Link
          key={post.id}
          href={
            detailQuery ? `/post/${post.id}?${detailQuery}` : `/post/${post.id}`
          }
          prefetch={false}
          className="relative aspect-3/4 overflow-hidden bg-gray-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.resolvedImageUrl as string}
            alt=""
            className="h-full w-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
          />
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

export default memo(ProfilePostGrid);
