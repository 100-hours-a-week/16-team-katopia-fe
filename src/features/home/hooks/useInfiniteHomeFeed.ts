import { useCallback, useEffect, useRef, useState } from "react";
import { getHomePosts, type GetHomePostsResponse } from "../api/getHomePosts";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";

export type HomePost = {
  id: number;
  author: {
    id: number;
    displayName: string;
    username: string;
    avatarUrl?: string | null;
    gender?: string | null;
    height?: number | null;
    weight?: number | null;
  };
  imageUrl?: string | null;
  imageUrls?: string[];
  imageCount?: number;
  likeCount: number;
  commentCount: number;
  caption: string;
  tags?: string[];
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt?: string | null;
};

function mapHomePosts(data: GetHomePostsResponse) {
  const posts = data.posts ?? [];

  return posts.map<HomePost>((post) => {
    const author = post.author ?? {
      id: 0,
      nickname: "",
    };
    const imageUrls = post.imageUrls ?? [];
    const imageUrl = imageUrls[0] ?? null;
    const avatarKey =
      author.profileImageObjectKey ?? author.profileImageUrl ?? null;

    return {
      id: post.id,
      author: {
        id: author.id,
        displayName: author.nickname ?? "",
        username: author.nickname ?? "",
        avatarUrl: avatarKey ? resolveMediaUrl(avatarKey) : null,
        gender: author.gender ?? null,
        height: author.height ?? null,
        weight: author.weight ?? null,
      },
      imageUrl,
      imageUrls,
      imageCount: imageUrls.length,
      likeCount: Number(post.aggregate?.likeCount ?? 0) || 0,
      commentCount: Number(post.aggregate?.commentCount ?? 0) || 0,
      caption: post.content ?? "",
      tags: post.tags ?? [],
      isLiked: Boolean(post.isLiked),
      isBookmarked: Boolean(post.isBookmarked),
      createdAt: post.createdAt ?? null,
    };
  });
}

export function useInfiniteHomeFeed(params?: {
  size?: number;
  enabled?: boolean;
}) {
  const [items, setItems] = useState<HomePost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const size = params?.size ?? 10;
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
      const data = await getHomePosts({
        size,
        after: cursorRef.current ?? undefined,
      });

      const mapped = mapHomePosts(data);

      setItems((prev) => {
        const map = new Map<number, HomePost>();
        prev.forEach((item) => map.set(item.id, item));
        mapped.forEach((item) => map.set(item.id, item));
        return Array.from(map.values());
      });

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

  return { items, hasMore, observe, loading, loadMore };
}
