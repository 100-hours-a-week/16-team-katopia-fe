"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useInfinitePostGrid } from "./useInfinitePostGrid";
import { searchUsers, type SearchUserItem } from "../api/searchUsers";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";

type ActiveTab = "계정" | "게시글/해시태그";

const normalizeHashtagQuery = (value: string) => {
  if (!value.startsWith("#")) return value;
  const raw = value.slice(1).trim();
  const tag = raw.match(/^[^#\s]+/)?.[0] ?? "";
  return tag ? `#${tag}` : "#";
};

export function useSearchPageController() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, isAuthenticated } = useAuth();
  const tabParam = searchParams.get("tab");
  const qParam = searchParams.get("q") ?? "";

  const initialTab: ActiveTab =
    tabParam === "posts" || tabParam === "게시글/해시태그"
      ? "게시글/해시태그"
      : "계정";

  const [isSearching, setIsSearching] = useState(
    qParam.length > 0 || !!tabParam,
  );
  const [inputSeed, setInputSeed] = useState(qParam);
  const [query, setQuery] = useState(qParam);
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  const {
    items: gridPosts,
    loading: gridLoading,
    hasMore: gridHasMore,
    observe: observeGrid,
  } = useInfinitePostGrid({
    enabled: ready && isAuthenticated,
  });

  const [accountResults, setAccountResults] = useState<SearchUserItem[]>([]);
  const [accountLoading, setAccountLoading] = useState(false);

  const {
    items: postResults,
    loading: postLoading,
    hasMore: postHasMore,
    observe: observePosts,
  } = useInfinitePostGrid({
    mode: "search",
    query,
    enabled:
      ready &&
      isAuthenticated &&
      activeTab === "게시글/해시태그" &&
      query.trim().length >= 2,
  });

  const handleFocus = useCallback(() => {
    setIsSearching(true);
  }, []);

  const handleBack = useCallback(() => {
    setIsSearching(false);
    setInputSeed("");
    setQuery("");
    setActiveTab("계정");
  }, []);

  const handleDebouncedChange = useCallback((nextValue: string) => {
    const trimmed = nextValue.trim();
    setQuery(trimmed.startsWith("#") ? normalizeHashtagQuery(trimmed) : trimmed);
  }, []);

  const trimmedQuery = query.trim();

  useEffect(() => {
    if (activeTab !== "계정") return;

    if (trimmedQuery.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccountResults([]);
      return;
    }

    setAccountLoading(true);

    searchUsers({ query: trimmedQuery })
      .then((data) => {
        setAccountResults(data.members);
      })
      .catch(() => {
        setAccountResults([]);
      })
      .finally(() => setAccountLoading(false));
  }, [activeTab, trimmedQuery]);

  const shouldShowAccounts = activeTab === "계정" && trimmedQuery.length >= 2;
  const shouldShowAccountEmpty =
    shouldShowAccounts && !accountLoading && accountResults.length === 0;
  const shouldShowPosts =
    activeTab === "게시글/해시태그" && trimmedQuery.length >= 2;
  const shouldShowPostEmpty =
    shouldShowPosts && !postLoading && postResults.length === 0;

  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated) return;
    router.replace("/home");
  }, [isAuthenticated, ready, router]);

  useEffect(() => {
    if (!ready || !isAuthenticated) return;
    const params = new URLSearchParams();

    if (isSearching) {
      const normalizedQuery = query.trim().startsWith("#")
        ? normalizeHashtagQuery(query.trim())
        : query.trim();
      if (normalizedQuery.length > 0) {
        params.set("q", normalizedQuery);
      }
      params.set("tab", activeTab === "게시글/해시태그" ? "posts" : "account");
    }

    const next = params.toString();
    router.replace(next ? `/search?${next}` : "/search");
  }, [activeTab, isAuthenticated, isSearching, query, ready, router]);

  return {
    ready,
    isAuthenticated,
    isSearching,
    inputSeed,
    query,
    activeTab,
    gridPosts,
    gridLoading,
    gridHasMore,
    observeGrid,
    accountResults,
    accountLoading,
    postResults,
    postLoading,
    postHasMore,
    observePosts,
    trimmedQuery,
    shouldShowAccounts,
    shouldShowAccountEmpty,
    shouldShowPosts,
    shouldShowPostEmpty,
    setActiveTab,
    handleFocus,
    handleBack,
    handleDebouncedChange,
  };
}
