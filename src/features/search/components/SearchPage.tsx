"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import SearchInput from "./SearchInput";
import SearchGrid from "./SearchGrid";
import SearchTabs from "./SearchTabs";
import SearchResultEmpty from "./SearchResultEmpty";
import SearchAccountList from "./SearchAccountList";
import { MOCK_ACCOUNTS } from "../data/mockAccounts";

export default function SearchPage() {
  const searchParams = useSearchParams();
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

  const handleFocus = useCallback(() => {
    setIsSearching(true);
  }, []);

  const handleBack = useCallback(() => {
    setIsSearching(false);
    setInputValue("");
    setQuery("");
    setActiveTab("계정");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(inputValue);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const trimmedQuery = query.trim();
  const filteredAccounts =
    trimmedQuery.length === 0
      ? []
      : MOCK_ACCOUNTS.filter((acc) =>
          acc.nickname.toLowerCase().includes(trimmedQuery.toLowerCase()),
        );
  const shouldShowAccounts = activeTab === "계정" && trimmedQuery.length > 0;
  const shouldShowAccountEmpty =
    shouldShowAccounts && filteredAccounts.length === 0;
  const shouldShowPosts =
    isSearching && activeTab === "게시글/해시태그" && trimmedQuery.length > 0;

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
          {shouldShowAccounts && (
            <>
              {filteredAccounts.length > 0 ? (
                <SearchAccountList
                  accounts={filteredAccounts}
                  searchQuery={trimmedQuery}
                />
              ) : (
                <SearchResultEmpty query={query} />
              )}
            </>
          )}
          {shouldShowPosts && <SearchGrid />}
        </>
      ) : (
        <SearchGrid />
      )}
    </div>
  );
}
