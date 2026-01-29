import { useCallback, useEffect, useRef, useState } from "react";
import { getPostList } from "../../post/api/getPostList";
import { getMemberPosts } from "../../profile/api/getMemberPosts";

type GridPost = {
  id: number;
  imageUrl: string;
};

type Params = {
  memberId?: number;
  size?: number;
  mode?: "public" | "member";
};

export function useInfinitePostGrid(params?: Params) {
  const [items, setItems] = useState<GridPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ✅ mode로 명시적으로 제어
  const isMemberMode = params?.mode === "member";
  const size = params?.size ?? 18;
  const memberId = params?.memberId;

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

    // 멤버 모드인데 memberId 없으면 중단
    if (isMemberMode && typeof memberId !== "number") return;

    inFlightRef.current = true;
    setLoading(true);

    const prevCursor = cursorRef.current;
    try {
      const afterForMember =
        cursorRef.current != null ? String(cursorRef.current) : undefined;

      const afterForPost =
        cursorRef.current != null ? String(cursorRef.current) : undefined;

      const data = isMemberMode
        ? await getMemberPosts({
            memberId: memberId as number,
            size,
            after: afterForMember, // string
          })
        : await getPostList({
            size,
            after: afterForPost, // number
          });

      const mapped: GridPost[] = data.posts
        .map(
          (post: { id: number; imageUrls?: string[]; imageUrl?: string }) => ({
            id: post.id,
            imageUrl: Array.isArray(post.imageUrls)
              ? post.imageUrls[0]
              : (post.imageUrl ?? ""),
          }),
        )
        .filter((p) => Boolean(p.imageUrl));

      setItems((prev) => {
        const map = new Map<number, GridPost>();
        prev.forEach((it) => map.set(it.id, it));
        mapped.forEach((it) => map.set(it.id, it));
        return Array.from(map.values());
      });

      if (data.nextCursor === prevCursor) {
        setHasMore(false);
        return;
      }
      setNextCursor(data.nextCursor ?? null);
      setHasMore(data.nextCursor != null);
    } catch (e) {
      // 요청 실패 시 더 불러오기 중단(무한 재시도 방지)
      setHasMore(false);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [isMemberMode, memberId, size]);

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

    // 멤버 모드인데 memberId 없으면 로드하지 않음
    if (isMemberMode && typeof memberId !== "number") return;

    loadMore();
  }, [isMemberMode, memberId, size, loadMore]);

  // 언마운트 정리
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  return { items, hasMore, observe, loading, loadMore };
}
