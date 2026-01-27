"use client";

import { memo } from "react";
import SearchAccountItem from "./SearchAccountItem";
import type { SearchUserItem } from "../api/searchUsers";

interface Props {
  accounts: SearchUserItem[];
  searchQuery: string;
}

function SearchAccountList({ accounts, searchQuery }: Props) {
  return (
    <div className="mt-4">
      {accounts.map((account) => (
        <SearchAccountItem
          key={account.id}
          nickname={account.nickname}
          userId={account.id}
          profileImage={account.profileImageUrl ?? undefined}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}

export default memo(SearchAccountList);
