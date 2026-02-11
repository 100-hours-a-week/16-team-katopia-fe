"use client";

import SearchItem from "./SearchItem";
import SearchSkeleton from "./SearchItemSkeleton";

type GridPost = {
  id: number;
  imageUrl: string;
};

type SearchGridProps = {
  posts: GridPost[];
  loading?: boolean;
  priorityCount?: number;
};

export default function SearchGrid({
  posts,
  loading,
  priorityCount = 3,
}: SearchGridProps) {
  // 최초 로딩 스켈레톤
  if (loading && posts.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <SearchSkeleton key={i} />
        ))}
      </div>
    );
  }

  // 결과 없음
  if (!loading && posts.length === 0) {
    return (
      <div className="mt-10 text-center text-sm text-gray-400">
        게시글이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {posts.map((post, index) => (
        <SearchItem
          key={post.id}
          src={post.imageUrl}
          postId={post.id}
          priority={index < priorityCount}
        />
      ))}

      {/* 추가 로딩용 스켈레톤 (선택) */}
      {loading &&
        Array.from({ length: 3 }).map((_, i) => (
          <SearchSkeleton key={`loading-${i}`} />
        ))}
    </div>
  );
}
