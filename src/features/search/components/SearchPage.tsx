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
import { searchPosts } from "../api/searchPosts";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";

type GridPost = {
  id: number;
  imageUrl: string;
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, isAuthenticated } = useAuth();
  const tabParam = searchParams.get("tab");
  const qParam = searchParams.get("q") ?? "";

  const initialTab: "계정" | "게시글/해시태그" =
    tabParam === "posts" || tabParam === "게시글/해시태그"
      ? "게시글/해시태그"
      : "계정";

  const [isSearching, setIsSearching] = useState(
    qParam.length > 0 || !!tabParam,
  );
  const [inputValue, setInputValue] = useState(qParam);
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
  } = useInfinitePostGrid();

  /* -------------------------
     계정 검색 결과
  ------------------------- */
  const [accountResults, setAccountResults] = useState<SearchUserItem[]>([]);
  const [accountLoading, setAccountLoading] = useState(false);

  /* -------------------------
     게시글 검색 결과
  ------------------------- */
  const [postResults, setPostResults] = useState<GridPost[]>([]);
  const [postLoading, setPostLoading] = useState(false);

  const handleFocus = useCallback(() => {
    setIsSearching(true);
  }, []);

  const handleBack = useCallback(() => {
    setIsSearching(false);
    setInputValue("");
    setQuery("");
    setActiveTab("계정");
  }, []);

  /* -------------------------
     검색어 디바운스
  ------------------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(inputValue.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [inputValue]);

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

  /* -------------------------
     게시글/해시태그 검색 API
  ------------------------- */
  useEffect(() => {
    if (activeTab !== "게시글/해시태그") return;

    if (trimmedQuery.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPostResults([]);
      return;
    }

    setPostLoading(true);

    searchPosts({
      query: trimmedQuery,
      size: 18,
    })
      .then((data) => {
        const mapped = data.posts
          .map((post) => ({
            id: post.id,
            imageUrl: post.imageUrls?.[0],
          }))
          .filter((p): p is GridPost => Boolean(p.imageUrl));

        setPostResults(mapped);
      })
      .catch(() => {
        setPostResults([]);
      })
      .finally(() => setPostLoading(false));
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
      if (query.trim().length > 0) {
        params.set("q", query.trim());
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
        value={inputValue}
        onChange={setInputValue}
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
            (postResults.length > 0 ? (
              <SearchGrid posts={postResults} loading={postLoading} />
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
