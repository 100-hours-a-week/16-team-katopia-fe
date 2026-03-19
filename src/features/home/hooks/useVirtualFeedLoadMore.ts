import { useCallback, useRef } from "react";
import type { Virtualizer } from "@tanstack/react-virtual";

type UseVirtualFeedLoadMoreOptions = {
  itemCount: number;
  hasMore: boolean;
  loading: boolean;
  loadAhead?: number;
  onLoadMore: () => void;
};

export function useVirtualFeedLoadMore({
  itemCount,
  hasMore,
  loading,
  loadAhead = 0,
  onLoadMore,
}: UseVirtualFeedLoadMoreOptions) {
  const requestedAtCountRef = useRef<number | null>(null);
  const totalCount = hasMore ? itemCount + 1 : itemCount;

  const isLoaderRow = useCallback(
    (index: number) => hasMore && index === itemCount,
    [hasMore, itemCount],
  );

  const onVirtualChange = useCallback(
    (instance: Virtualizer<Window, Element>) => {
      if (!hasMore || loading) return;
      const virtualItems = instance.getVirtualItems();
      const last = virtualItems[virtualItems.length - 1];
      if (!last) return;
      const loaderIndex = itemCount;
      const shouldLoad = last.index >= loaderIndex - loadAhead;
      if (!shouldLoad) return;
      if (requestedAtCountRef.current === itemCount) return;

      requestedAtCountRef.current = itemCount;
      onLoadMore();
    },
    [hasMore, itemCount, loadAhead, loading, onLoadMore],
  );

  return {
    totalCount,
    isLoaderRow,
    onVirtualChange,
  };
}
