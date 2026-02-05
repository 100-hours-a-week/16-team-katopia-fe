"use client";

import { memo } from "react";

const TABS = ["계정", "게시글/해시태그"] as const;

interface Props {
  active: (typeof TABS)[number];
  onChange: (tab: (typeof TABS)[number]) => void;
}

function SearchTabs({ active, onChange }: Props) {
  return (
    <div className="mt-10 flex justify-center gap-28  pb-2">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`text-sm ${
            active === tab
              ? "font-semibold text-black"
              : "text-muted-foreground"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export default memo(SearchTabs);
