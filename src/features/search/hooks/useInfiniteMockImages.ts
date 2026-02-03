import { useCallback, useMemo, useRef, useState } from "react";
import { MOCK_IMAGES } from "../data/mockImages";

const PAGE_SIZE = 12;

export function useInfiniteMockImages() {
  const [page, setPage] = useState(1);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const items = useMemo(() => MOCK_IMAGES.slice(0, page * PAGE_SIZE), [page]);
  const hasMore = items.length < MOCK_IMAGES.length;

  const observe = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !hasMore) return;
      if (typeof IntersectionObserver === "undefined") return;

      observerRef.current?.disconnect();

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setPage((prev) => prev + 1);
          }
        },
        { threshold: 0.3 },
      );

      observerRef.current.observe(node);
    },
    [hasMore],
  );

  return {
    items,
    hasMore,
    observe,
  };
}
