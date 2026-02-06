"use client";

import SearchInput from "./SearchInput";
import SearchGrid from "./SearchGrid";
import SearchTabs from "./SearchTabs";
import SearchResultEmpty from "./SearchResultEmpty";
import SearchAccountList from "./SearchAccountList";

import { useSearchPageController } from "../hooks/useSearchPageController";

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
    observeGrid,
    accountResults,
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
  } = useSearchPageController();

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
