"use client";

import { useEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { HomePost } from "../hooks/useInfiniteHomeFeed";
import HomePostCard from "./HomePostCard";
import { useVirtualFeedLoadMore } from "../hooks/useVirtualFeedLoadMore";

type HomeVirtualFeedProps = {
  posts: HomePost[];
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
};

const DEFAULT_ESTIMATED_ROW_HEIGHT = 500;
const DEFAULT_OVERSCAN = 2;

export default function HomeVirtualFeed({
  posts,
  hasMore,
  loading,
  loadMore,
}: HomeVirtualFeedProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    const updateScrollMargin = () => {
      const container = containerRef.current;
      if (!container) return;
      const next = container.getBoundingClientRect().top + window.scrollY;
      setScrollMargin((prev) => (prev === next ? prev : next));
    };

    updateScrollMargin();
    window.addEventListener("resize", updateScrollMargin);
    window.addEventListener("orientationchange", updateScrollMargin);

    return () => {
      window.removeEventListener("resize", updateScrollMargin);
      window.removeEventListener("orientationchange", updateScrollMargin);
    };
  }, []);

  const { totalCount, isLoaderRow, onVirtualChange } = useVirtualFeedLoadMore({
    itemCount: posts.length,
    hasMore,
    loading,
    loadAhead: 0,
    onLoadMore: loadMore,
  });

  const rowVirtualizer = useWindowVirtualizer({
    count: totalCount,
    estimateSize: () => DEFAULT_ESTIMATED_ROW_HEIGHT,
    overscan: DEFAULT_OVERSCAN,
    scrollMargin,
    onChange: onVirtualChange,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <section ref={containerRef} className="relative pb-12">
      <div
        className="relative"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map((virtualRow) => {
          if (isLoaderRow(virtualRow.index)) {
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                className="absolute left-0 top-0 w-full px-2 py-6 text-center text-[12px] text-[#777]"
                style={{
                  transform: `translateY(${
                    virtualRow.start - rowVirtualizer.options.scrollMargin
                  }px)`,
                }}
              >
                {loading ? "불러오는 중..." : "더 불러오는 중..."}
              </div>
            );
          }

          const post = posts[virtualRow.index];
          if (!post) return null;

          return (
            <div
              key={virtualRow.key}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              className="absolute left-0 top-0 w-full pb-10"
              style={{
                transform: `translateY(${
                  virtualRow.start - rowVirtualizer.options.scrollMargin
                }px)`,
              }}
            >
              <HomePostCard
                post={post}
                prioritizeMedia={virtualRow.index === 0}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
