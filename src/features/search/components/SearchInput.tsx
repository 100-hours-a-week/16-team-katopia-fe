"use client";

import { memo } from "react";
import { Input } from "@/components/ui/input";
import Image from "next/image";

function SearchInput() {
  return (
    <div className="relative mb-6">
      <Image
        src="/icons/search.svg"
        alt="검색"
        width={18}
        height={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60"
      />

      <Input
        placeholder="검색어를 입력하세요. (ex) 여름 코디 or #데일리룩"
        className="pl-10 h-11 text-sm"
      />
    </div>
  );
}

export default memo(SearchInput);
