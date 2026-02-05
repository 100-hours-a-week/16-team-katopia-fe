"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import SearchInput from "./SearchInput";
import SearchGrid from "./SearchGrid";
import SearchTabs from "./SearchTabs";
import SearchResultEmpty from "./SearchResultEmpty";
import SearchAccountList from "./SearchAccountList";

import { useInfinitePostGrid } from "../hooks/useInfinitePostGrid";
import { searchUsers, SearchUserItem } from "../api/searchUsers";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, isAuthenticated } = useAuth();
  const tabParam = searchParams.get("tab");
  const qParam = searchParams.get("q") ?? "";
  const normalizeHashtagQuery = (value: string) => {
    if (!value.startsWith("#")) return value;
    const raw = value.slice(1).trim();
    const tag = raw.match(/^[^#\s]+/)?.[0] ?? "";
    return tag ? `#${tag}` : "#";
  };

  const initialTab: "계정" | "게시글/해시태그" =
    tabParam === "posts" || tabParam === "게시글/해시태그"
      ? "게시글/해시태그"
      : "계정";

  const [isSearching, setIsSearching] = useState(
    qParam.length > 0 || !!tabParam,
  );
  const [inputSeed, setInputSeed] = useState(qParam);
  const [query, setQuery] = useState(qParam);
  const [activeTab, setActiveTab] = useState<"계정" | "게시글/해시태그">(
    initialTab,
  );

  /* -------------------------
     검색 전 게시글 그리드 (무한 스크롤)
  ------------------------- */
  const {
    items: gridPosts,
    loading: gridLoading,
    hasMore: gridHasMore,
    observe: observeGrid,
  } = useInfinitePostGrid({
    enabled: ready && isAuthenticated,
  });

  /* -------------------------
     계정 검색 결과
  ------------------------- */
  const [accountResults, setAccountResults] = useState<SearchUserItem[]>([]);
  const [accountLoading, setAccountLoading] = useState(false);

  /* -------------------------
     게시글 검색 결과 (무한 스크롤)
  ------------------------- */
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
  }, [setIsSearching]);

  const handleBack = useCallback(() => {
    setIsSearching(false);
    setInputSeed("");
    setQuery("");
    setActiveTab("계정");
  }, [setIsSearching, setInputSeed, setQuery, setActiveTab]);

  const handleDebouncedChange = useCallback(
    (nextValue: string) => {
      const trimmed = nextValue.trim();
      setQuery(
        trimmed.startsWith("#") ? normalizeHashtagQuery(trimmed) : trimmed,
      );
    },
    [setQuery],
  );

  /* -------------------------
     계정 검색 API
  ------------------------- */
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

  /* -------------------------
     Render
  ------------------------- */
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

  if (!ready || !isAuthenticated) {
    return null;
  }

  return (
    <div className="px-4 py-4">
      <SearchInput
        seedValue={inputSeed}
        onDebouncedChange={handleDebouncedChange}
        onFocus={handleFocus}
        onBack={handleBack}
        isSearching={isSearching}
      />

      {isSearching ? (
        <>
          <SearchTabs active={activeTab} onChange={setActiveTab} />

          {/* 계정 검색 */}
          {shouldShowAccounts &&
            (accountResults.length > 0 ? (
              <SearchAccountList
                accounts={accountResults}
                searchQuery={trimmedQuery}
              />
            ) : (
              shouldShowAccountEmpty && <SearchResultEmpty query={query} />
            ))}

          {/* 게시글 / 해시태그 검색 */}
          {shouldShowPosts &&
            (postResults.length > 0 || postLoading ? (
              <>
                <SearchGrid posts={postResults} loading={postLoading} />
                {postHasMore && <div ref={observePosts} className="h-24" />}
              </>
            ) : (
              shouldShowPostEmpty && <SearchResultEmpty query={query} />
            ))}
        </>
      ) : (
        <>
          <SearchGrid posts={gridPosts} loading={gridLoading} />
          {gridHasMore && <div ref={observeGrid} className="h-24" />}
        </>
      )}
    </div>
  );
}
