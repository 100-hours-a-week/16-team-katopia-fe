import { useCallback, useEffect, useRef, useState } from "react";
import { getNotifications } from "@/src/features/notifications/api/getNotifications";
import { useNotificationsStore } from "@/src/features/notifications/store/notificationsStore";

type Params = {
  size?: number;
  enabled?: boolean;
};

export function useInfiniteNotifications(params?: Params) {
  const items = useNotificationsStore((state) => state.items);
  const setItems = useNotificationsStore((state) => state.setItems);
  const mergeItems = useNotificationsStore((state) => state.mergeItems);
  const clearItems = useNotificationsStore((state) => state.clear);
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
    if (!enabled) return;
    if (inFlightRef.current) return;
    if (!hasMoreRef.current) return;

    inFlightRef.current = true;
    setLoading(true);

    const prevCursor = cursorRef.current;
    try {
      const data = await getNotifications({
        size,
        after: cursorRef.current,
      });

      const newItems = data.notifications ?? [];
      mergeItems(newItems);

      const rawNextCursor =
        data.nextCursor === "" ? null : (data.nextCursor ?? null);
      if (rawNextCursor === prevCursor) {
        setHasMore(false);
        return;
      }
      cursorRef.current = rawNextCursor;
      setNextCursor(rawNextCursor);
      setHasMore(rawNextCursor != null);
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
    clearItems();
    setNextCursor(null);
    setHasMore(true);
    cursorRef.current = null;
    hasMoreRef.current = true;
    inFlightRef.current = false;

    if (!enabled) return;
    loadMore();
  }, [enabled, size, loadMore, clearItems]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (inFlightRef.current) return;
        if (!hasMoreRef.current) return;
        const doc = document.documentElement;
        const scrolled = window.scrollY + window.innerHeight;
        const threshold = doc.scrollHeight - 600;
        if (scrolled >= threshold) {
          loadMore();
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled, loadMore]);

  return { items, setItems, hasMore, observe, loading, loadMore };
}
