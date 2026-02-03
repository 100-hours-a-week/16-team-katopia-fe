import { useCallback, useEffect, useRef, useState } from "react";
import { getPostList } from "../../post/api/getPostList";
import { getMemberPosts } from "../../profile/api/getMemberPosts";
import { searchPosts } from "../api/searchPosts";
import { normalizeImageUrls } from "@/src/features/upload/utils/normalizeImageUrls";

type GridPost = {
  id: number;
  imageUrl: string;
};

type Params = {
  memberId?: number;
  size?: number;
  mode?: "public" | "member" | "search";
  query?: string;
  enabled?: boolean;
};

export function useInfinitePostGrid(params?: Params) {
  const [items, setItems] = useState<GridPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ✅ mode로 명시적으로 제어
  const isMemberMode = params?.mode === "member";
  const isSearchMode = params?.mode === "search";
  const size = params?.size ?? 18;
  const memberId = params?.memberId;
  const enabled = params?.enabled ?? true;
  const query = params?.query ?? "";
  const trimmedQuery = query.trim();

  const observerRef = useRef<IntersectionObserver | null>(null);

  // ✅ 중복 호출 방지 락
  const inFlightRef = useRef(false);

  // ✅ 최신 값 참조용 refs (stale closure 방지)
  const cursorRef = useRef<string | number | null>(null);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    cursorRef.current = nextCursor;
  }, [nextCursor]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const loadMore = useCallback(async () => {
    // 🔒 중복/폭주 방지
    if (inFlightRef.current) return;
    if (!hasMoreRef.current) return;
    if (!enabled) return;

    // 멤버 모드인데 memberId 없으면 중단
    if (isMemberMode && typeof memberId !== "number") return;
    if (isSearchMode && trimmedQuery.length < 2) return;

    inFlightRef.current = true;
    setLoading(true);

    const prevCursor = cursorRef.current;
    try {
      const afterForMember =
        cursorRef.current != null ? String(cursorRef.current) : undefined;

      const afterForPost =
        cursorRef.current != null ? String(cursorRef.current) : undefined;

      const data = isSearchMode
        ? await searchPosts({
            query: trimmedQuery,
            size,
            after: afterForPost,
          })
        : isMemberMode
          ? await getMemberPosts({
              memberId: memberId as number,
              size,
              after: afterForMember, // string
            })
          : await getPostList({
              size,
              after: afterForPost, // number
            });

      const rawPosts =
        (data.posts as {
          id: number;
          imageUrls?: string[];
          imageUrl?: string;
        }[]) ?? [];
      const rawCount = rawPosts.length;
      const lastRawId = rawPosts[rawCount - 1]?.id ?? null;

      const mapped: GridPost[] = rawPosts
        .map((post) => {
          const rawKey =
            (post as { imageObjectKeys?: unknown; imageObjectKey?: unknown })
              .imageObjectKeys ??
            (post as { imageObjectKey?: unknown }).imageObjectKey ??
            post.imageUrls ??
            post.imageUrl ??
            [];
          console.log("[posts] imageObjectKey raw", rawKey);
          const normalized = normalizeImageUrls(rawKey);
          return {
            id: post.id,
            imageUrl: normalized[0] ?? "",
          };
        })
        .filter((p) => Boolean(p.imageUrl));

      setItems((prev) => {
        const map = new Map<number, GridPost>();
        prev.forEach((it) => map.set(it.id, it));
        mapped.forEach((it) => map.set(it.id, it));
        return Array.from(map.values());
      });

      const rawNextCursor =
        data.nextCursor === "" ? null : data.nextCursor ?? null;
      const shouldFallbackCursor =
        !isMemberMode &&
        !isSearchMode &&
        rawNextCursor == null &&
        lastRawId != null;
      const fallbackCursor = shouldFallbackCursor ? lastRawId : null;
      const nextCursorValue = shouldFallbackCursor
        ? fallbackCursor
        : rawNextCursor;

      if (nextCursorValue === prevCursor) {
        setHasMore(false);
        return;
      }
      cursorRef.current = nextCursorValue;
      setNextCursor(nextCursorValue);
      setHasMore(nextCursorValue != null);
    } catch {
      // 요청 실패 시 더 불러오기 중단(무한 재시도 방지)
      setHasMore(false);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [enabled, isMemberMode, isSearchMode, memberId, size, trimmedQuery]);

  const observe = useCallback(
    (node: HTMLDivElement | null) => {
      // 기존 옵저버 정리
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry?.isIntersecting) return;

          // loading state는 setState 지연이 있어서 ref 락으로 제어
          loadMore();
        },
        {
          // ✅ 미리 로딩되도록 여유 주기 (폭주 방지 + 체감 개선)
          root: null,
          rootMargin: "600px 0px",
          threshold: 0.01,
        },
      );

      observerRef.current.observe(node);
    },
    [loadMore],
  );

  // ✅ memberId(또는 모드) 바뀌면 목록/커서 초기화 후 1페이지 로드
  useEffect(() => {
    setItems([]);
    setNextCursor(null);
    setHasMore(true);
    cursorRef.current = null;
    hasMoreRef.current = true;
    inFlightRef.current = false;

    if (!enabled) return;
    // 멤버 모드인데 memberId 없으면 로드하지 않음
    if (isMemberMode && typeof memberId !== "number") return;
    if (isSearchMode && trimmedQuery.length < 2) return;

    loadMore();
  }, [
    enabled,
    isMemberMode,
    isSearchMode,
    memberId,
    size,
    trimmedQuery,
    loadMore,
  ]);

  // 언마운트 정리
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  // IntersectionObserver가 동작하지 않는 환경 대비 스크롤 폴백
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (isMemberMode && typeof memberId !== "number") return;
    if (isSearchMode && trimmedQuery.length < 2) return;

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
  }, [enabled, isMemberMode, isSearchMode, memberId, trimmedQuery, loadMore]);

  return { items, hasMore, observe, loading, loadMore };
}
