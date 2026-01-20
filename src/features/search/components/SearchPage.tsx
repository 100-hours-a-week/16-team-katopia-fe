"use client";

import { useState, useCallback, useEffect } from "react";
import SearchInput from "./SearchInput";
import SearchGrid from "./SearchGrid";
import SearchTabs from "./SearchTabs";
import SearchResultEmpty from "./SearchResultEmpty";
import SearchAccountList from "./SearchAccountList";
import { MOCK_ACCOUNTS } from "../data/mockAccounts";

export default function SearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"계정" | "게시글/해시태그">(
    "계정",
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
                <SearchAccountList accounts={filteredAccounts} />
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
