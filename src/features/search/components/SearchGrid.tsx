"use client";

import SearchItem from "./SearchItem";
import SearchSkeleton from "./SearchItemSkeleton";
import { useInfiniteMockImages } from "../hooks/useInfiniteMockImages";

export default function SearchGrid() {
  const { items, hasMore, observe } = useInfiniteMockImages();

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <SearchItem key={item.id} src={item.src} />
      ))}

      {/* observer target */}
      {hasMore && (
        <div ref={observe} className="col-span-3 grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SearchSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}
