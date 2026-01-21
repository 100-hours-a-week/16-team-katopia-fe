"use client";

import { memo } from "react";
import { MockAccount } from "../data/mockAccounts";
import SearchAccountItem from "./SearchAccountItem";

interface Props {
  accounts: MockAccount[];
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
          profileImage={account.profileImage}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}

export default memo(SearchAccountList);
