import { useCallback, useEffect, useRef, useState } from "react";
import { getPostList } from "../../post/api/getPostList";

type GridPost = {
  id: number;
  imageUrl: string;
};

export function useInfinitePostGrid() {
  const [items, setItems] = useState<GridPost[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);

    getPostList({
      size: 18,
      after: nextCursor ?? undefined,
    })
      .then((data) => {
        const mapped = data.posts
          .map((post) => ({
            id: post.id,
            imageUrl: post.imageUrls[0],
          }))
          .filter((p) => p.imageUrl);

        setItems((prev) => {
          const map = new Map<number, GridPost>();
          prev.forEach((item) => map.set(item.id, item));
          mapped.forEach((item) => map.set(item.id, item));
          return Array.from(map.values());
        });
        setNextCursor(data.nextCursor ?? null);
        setHasMore(!!data.nextCursor);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loading, hasMore, nextCursor]);

  const observe = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loadMore, loading],
  );

  // 최초 1회 로드
  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, hasMore, observe, loading };
}
