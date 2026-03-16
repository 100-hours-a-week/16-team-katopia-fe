"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { AutoSizer } from "react-virtualized-auto-sizer";
import { useInfiniteLoader } from "react-window-infinite-loader";
import {
  List,
  type ListImperativeAPI,
  type RowComponentProps,
} from "react-window";
import SearchItem from "./SearchItem";
import SearchSkeleton from "./SearchItemSkeleton";

type GridPost = {
  id: number;
  imageUrl: string;
};

type SearchGridProps = {
  posts: GridPost[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => Promise<void>;
  height?: number;
  resetKey?: string;
};

const COLUMN_COUNT = 3;
const GRID_GAP = 2;
const MIN_GRID_HEIGHT = 240;
const DEFAULT_GRID_HEIGHT = 420;
const DEFAULT_GRID_WIDTH = 375;

type SearchGridRowProps = {
  posts: GridPost[];
  columnWidth: number;
  rowCount: number;
};

function SearchGridRow({
  index,
  style,
  posts,
  columnWidth,
  rowCount,
}: RowComponentProps<SearchGridRowProps>) {
  if (index >= rowCount) {
    return (
      <div style={style} className="flex gap-0.5">
        {Array.from({ length: COLUMN_COUNT }).map((_, skeletonIndex) => (
          <div
            key={`loading-${skeletonIndex}`}
            style={{ width: columnWidth, minWidth: columnWidth }}
            className="shrink-0"
          >
            <SearchSkeleton />
          </div>
        ))}
      </div>
    );
  }

  const rowItems = posts.slice(
    index * COLUMN_COUNT,
    index * COLUMN_COUNT + COLUMN_COUNT,
  );

  return (
    <div style={style} className="flex gap-0.5">
      {rowItems.map((post) => (
        <div
          key={post.id}
          style={{ width: columnWidth, minWidth: columnWidth }}
          className="shrink-0"
        >
          <SearchItem src={post.imageUrl} postId={post.id} />
        </div>
      ))}
    </div>
  );
}

function SearchGrid({
  posts,
  loading,
  hasMore = false,
  onLoadMore,
  height,
  resetKey,
}: SearchGridProps) {
  const listRef = useRef<ListImperativeAPI | null>(null);
  const gridHeight = Math.max(height ?? DEFAULT_GRID_HEIGHT, MIN_GRID_HEIGHT);
  const rowCount = Math.ceil(posts.length / COLUMN_COUNT);
  const totalRowCount = rowCount + (hasMore ? 1 : 0);

  useEffect(() => {
    listRef.current?.scrollToRow({ index: 0 });
  }, [listRef, resetKey]);

  const loadMoreRows = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (!onLoadMore || loading || !hasMore) return;
      if (stopIndex < rowCount && startIndex < rowCount) return;
      await onLoadMore();
    },
    [hasMore, loading, onLoadMore, rowCount],
  );

  const handleRowsRendered = useInfiniteLoader({
    isRowLoaded: (index) => index < rowCount,
    loadMoreRows,
    rowCount: totalRowCount,
    threshold: 2,
  });

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
    <div
      className="w-full overflow-hidden"
      style={{ height: gridHeight }}
    >
      <AutoSizer
        style={{ height: "100%", width: "100%" }}
        renderProp={({
          height: autoHeight,
          width,
        }: {
          height: number | undefined;
          width: number | undefined;
        }) => {
          const safeWidth = width || DEFAULT_GRID_WIDTH;
          const safeColumnWidth =
            (safeWidth - GRID_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;
          const safeRowHeight = Math.ceil((safeColumnWidth * 4) / 3);

          return (
            <List<SearchGridRowProps>
              className="overflow-x-hidden"
              defaultHeight={gridHeight}
              listRef={listRef}
              onRowsRendered={(rows) => handleRowsRendered(rows)}
              overscanCount={2}
              rowComponent={SearchGridRow}
              rowCount={totalRowCount}
              rowHeight={safeRowHeight}
              rowProps={{
                posts,
                columnWidth: safeColumnWidth,
                rowCount,
              }}
              style={{
                height: autoHeight || gridHeight,
                width: safeWidth,
              }}
            />
          );
        }}
      />
    </div>
  );
}

export default memo(SearchGrid);
