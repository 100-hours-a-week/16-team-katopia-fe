"use client";

import { useCallback, useEffect, useState } from "react";
import SearchInput from "./SearchInput";
import SearchGrid from "./SearchGrid";
import SearchTabs from "./SearchTabs";
import SearchResultEmpty from "./SearchResultEmpty";
import SearchAccountList from "./SearchAccountList";

import { useSearchPageController } from "../hooks/useSearchPageController";

const BOTTOM_NAV_HEIGHT = 64;
const MIN_GRID_HEIGHT = 240;
const GRID_COLUMNS = 3;
const GRID_GAP = 2;
const GRID_ASPECT_RATIO = 4 / 3;

function useGridViewportHeight() {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(420);

  useEffect(() => {
    if (!node || typeof window === "undefined") return;

    let frameId = 0;

    const updateHeight = () => {
      frameId = window.requestAnimationFrame(() => {
        const top = node.getBoundingClientRect().top;
        const nextHeight = Math.max(
          Math.floor(window.innerHeight - top - BOTTOM_NAV_HEIGHT),
          MIN_GRID_HEIGHT,
        );

        setHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      });
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(node);
    window.addEventListener("resize", updateHeight);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [node]);

  return { setNode, height };
}

function getPrefillItemCount(node: HTMLDivElement | null, height: number) {
  if (!node) return 0;

  const width = node.clientWidth;
  if (width <= 0) return 0;

  const columnWidth = (width - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
  const rowHeight = Math.ceil(columnWidth * GRID_ASPECT_RATIO);
  const visibleRows = Math.ceil(height / rowHeight);

  return (visibleRows + 1) * GRID_COLUMNS;
}

export default function SearchPage() {
  const {
    ready,
    isAuthenticated,
    isSearching,
    inputSeed,
    query,
    activeTab,
    gridPosts,
    gridLoading,
    gridHasMore,
    loadMoreGrid,
    accountResults,
    postResults,
    postLoading,
    postHasMore,
    loadMorePosts,
    accountHasMore,
    observeAccounts,
    markAccountFollowed,
    trimmedQuery,
    shouldShowAccounts,
    shouldShowAccountEmpty,
    shouldShowPosts,
    shouldShowPostEmpty,
    setActiveTab,
    handleFocus,
    handleBack,
    handleDebouncedChange,
  } = useSearchPageController();
  const [defaultGridHostNode, setDefaultGridHostNode] =
    useState<HTMLDivElement | null>(null);
  const [postGridHostNode, setPostGridHostNode] =
    useState<HTMLDivElement | null>(null);
  const { setNode: setDefaultGridHostRef, height: defaultGridHeight } =
    useGridViewportHeight();
  const { setNode: setPostGridHostRef, height: postGridHeight } =
    useGridViewportHeight();

  const handleDefaultGridHost = useCallback(
    (node: HTMLDivElement | null) => {
      setDefaultGridHostNode(node);
      setDefaultGridHostRef(node);
    },
    [setDefaultGridHostRef],
  );

  const handlePostGridHost = useCallback(
    (node: HTMLDivElement | null) => {
      setPostGridHostNode(node);
      setPostGridHostRef(node);
    },
    [setPostGridHostRef],
  );

  useEffect(() => {
    if (!ready || !isAuthenticated || isSearching) return;
    if (gridLoading || !gridHasMore) return;

    const minimumItems = getPrefillItemCount(
      defaultGridHostNode,
      defaultGridHeight,
    );

    if (minimumItems === 0) return;
    if (gridPosts.length >= minimumItems) return;

    void loadMoreGrid();
  }, [
    defaultGridHeight,
    gridHasMore,
    gridLoading,
    gridPosts.length,
    defaultGridHostNode,
    isAuthenticated,
    isSearching,
    loadMoreGrid,
    ready,
  ]);

  useEffect(() => {
    if (!ready || !isAuthenticated) return;
    if (!shouldShowPosts) return;
    if (postLoading || !postHasMore) return;

    const minimumItems = getPrefillItemCount(postGridHostNode, postGridHeight);

    if (minimumItems === 0) return;
    if (postResults.length >= minimumItems) return;

    void loadMorePosts();
  }, [
    isAuthenticated,
    loadMorePosts,
    postGridHeight,
    postHasMore,
    postGridHostNode,
    postLoading,
    postResults.length,
    ready,
    shouldShowPosts,
  ]);

  if (!ready) {
    return (
      <div className="px-4 py-4">
        <SearchInput
          seedValue={inputSeed}
          onDebouncedChange={handleDebouncedChange}
          onFocus={handleFocus}
          onBack={handleBack}
          isSearching={isSearching}
        />
        <SearchGrid posts={[]} loading />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="px-1 py-4">
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

          {shouldShowAccounts &&
            (accountResults.length > 0 ? (
              <SearchAccountList
                accounts={accountResults}
                searchQuery={trimmedQuery}
                onFollowed={markAccountFollowed}
              />
            ) : (
              shouldShowAccountEmpty && <SearchResultEmpty query={query} />
            ))}
          {shouldShowAccounts && accountHasMore && (
            <div ref={observeAccounts} className="h-24" />
          )}

          {shouldShowPosts &&
            (postResults.length > 0 || postLoading ? (
              <div ref={handlePostGridHost}>
                <SearchGrid
                  posts={postResults}
                  loading={postLoading}
                  hasMore={postHasMore}
                  onLoadMore={loadMorePosts}
                  height={postGridHeight}
                  resetKey={`posts-${trimmedQuery}`}
                />
              </div>
            ) : (
              shouldShowPostEmpty && <SearchResultEmpty query={query} />
            ))}
        </>
      ) : (
        <div ref={handleDefaultGridHost}>
          <SearchGrid
            posts={gridPosts}
            loading={gridLoading}
            hasMore={gridHasMore}
            onLoadMore={loadMoreGrid}
            height={defaultGridHeight}
            resetKey="default-grid"
          />
        </div>
      )}
    </div>
  );
}
