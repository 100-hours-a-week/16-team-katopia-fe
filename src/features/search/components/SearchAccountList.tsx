"use client";

import { memo } from "react";
import { MockAccount } from "../data/mockAccounts";
import SearchAccountItem from "./SearchAccountItem";

interface Props {
  accounts: MockAccount[];
}

function SearchAccountList({ accounts }: Props) {
  return (
    <div className="mt-4">
      {accounts.map((account) => (
        <SearchAccountItem
          key={account.id}
          nickname={account.nickname}
          userId={account.id}
          profileImage={account.profileImage}
        />
      ))}
    </div>
  );
}

export default memo(SearchAccountList);
