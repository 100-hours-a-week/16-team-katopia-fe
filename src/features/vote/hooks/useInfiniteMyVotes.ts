import { useCallback, useEffect, useRef, useState } from "react";
import { getMyVotes, type VoteListItem } from "../api/getMyVotes";

type Params = {
  size?: number;
  enabled?: boolean;
};

export function useInfiniteMyVotes(params?: Params) {
  const [items, setItems] = useState<VoteListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const size = params?.size ?? 20;
  const enabled = params?.enabled ?? true;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const inFlightRef = useRef(false);
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    cursorRef.current = nextCursor;
  }, [nextCursor]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const loadMore = useCallback(async () => {
    if (inFlightRef.current) return;
    if (!hasMoreRef.current) return;
    if (!enabled) return;

    inFlightRef.current = true;
    setLoading(true);

    const prevCursor = cursorRef.current;
    try {
      const data = await getMyVotes({
        cursor: cursorRef.current,
        size,
      });

      const mapped = data.votes ?? [];
      setItems((prev) => {
        const map = new Map<string | number, VoteListItem>();
        prev.forEach((it) => map.set(it.id, it));
        mapped.forEach((it) => map.set(it.id, it));
        return Array.from(map.values());
      });

      const nextCursorValue = data.nextCursor ?? null;
      if (nextCursorValue === prevCursor) {
        setHasMore(false);
        return;
      }

      cursorRef.current = nextCursorValue;
      setNextCursor(nextCursorValue);
      setHasMore(nextCursorValue != null);
    } catch {
      setHasMore(false);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [enabled, size]);

  const observe = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry?.isIntersecting) return;
          loadMore();
        },
        {
          root: null,
          rootMargin: "600px 0px",
          threshold: 0.01,
        },
      );

      observerRef.current.observe(node);
    },
    [loadMore],
  );

  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    setHasMore(true);
    cursorRef.current = null;
    hasMoreRef.current = true;
    inFlightRef.current = false;

    if (!enabled) return;
    loadMore();
  }, [enabled, size, loadMore]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  const removeById = useCallback((id: number | string) => {
    setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
  }, []);

  return { items, hasMore, observe, loading, loadMore, removeById };
}
