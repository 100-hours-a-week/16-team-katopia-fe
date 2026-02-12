"use client";

import { memo } from "react";
import SearchAccountItem from "./SearchAccountItem";
import type { SearchUserItem } from "../api/searchUsers";

interface Props {
  accounts: SearchUserItem[];
  searchQuery: string;
  onFollowed?: (userId: number | string) => void;
}

function SearchAccountList({ accounts, searchQuery, onFollowed }: Props) {
  return (
    <div className="mt-4">
      {accounts.map((account) => (
        <SearchAccountItem
          key={account.id}
          nickname={account.nickname}
          userId={account.id}
          profileImage={account.profileImageUrl ?? undefined}
          searchQuery={searchQuery}
          isFollowing={account.isFollowing}
          onFollowed={onFollowed}
        />
      ))}
    </div>
  );
}

export default memo(SearchAccountList);
