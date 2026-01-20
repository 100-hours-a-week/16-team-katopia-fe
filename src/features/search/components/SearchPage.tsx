"use client";

import SearchInput from "./SearchInput";
import SearchGrid from "./SearchGrid";

export default function SearchPage() {
  return (
    <div className="px-4 py-4">
      <SearchInput />
      <SearchGrid />
    </div>
  );
}
