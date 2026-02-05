"use client";

import { memo, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";

interface Props {
  seedValue: string;
  onDebouncedChange: (v: string) => void;
  onFocus: () => void;
  onBack: () => void; // 취소 버튼에서 사용
  isSearching: boolean;
}

function SearchInput({
  seedValue,
  onDebouncedChange,
  onFocus,
  onBack,
  isSearching,
}: Props) {
  const [value, setValue] = useState(seedValue);
  const [overLimit, setOverLimit] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setValue(seedValue);
    setOverLimit(seedValue.length > 20);
  }, [seedValue]);

  useEffect(() => {
    if (value.length <= 20) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOverLimit(false);
    }
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      onDebouncedChange(value);
    }, 400);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [onDebouncedChange, value]);

  const handleChange = (nextValue: string) => {
    if (nextValue.length > 20) {
      setValue(nextValue.slice(0, 20));
      setOverLimit(true);
      return;
    }
    setOverLimit(false);
    setValue(nextValue);
  };

  return (
    <div className="mb-4 flex items-center gap-3">
      {/* 검색 입력창 */}
      <div
        className={`
          relative
          transition-all
          duration-200
          ${isSearching ? "flex-[0.999]" : "flex-1"}
        `}
      >
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={onFocus}
          placeholder="검색"
          className={`pl-10 pr-8 h-11 text-[13px] focus-visible:ring-0 placeholder:text-[#c4c4c4] ${
            overLimit
              ? "border-red-500 focus-visible:border-red-500"
              : "focus-visible:border-black"
          }`}
        />

        {/* 검색 아이콘 */}
        <Image
          src="/icons/search.svg"
          alt="검색"
          width={18}
          height={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60"
        />

        {/* clear 버튼 */}
        {value && isSearching && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              onDebouncedChange("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* 취소 버튼 */}
      {isSearching && (
        <button
          type="button"
          onClick={onBack}
          className="ml-auto text-sm font-medium text-black whitespace-nowrap"
        >
          취소
        </button>
      )}
    </div>
  );
}

export default memo(SearchInput);
