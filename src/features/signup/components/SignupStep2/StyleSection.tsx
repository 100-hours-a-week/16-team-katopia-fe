"use client";

import { memo } from "react";

const STYLE_OPTIONS = [
  "미니멀",
  "페미닌",
  "시크모던",
  "러블리",
  "빈티지",
  "캐주얼",
  "스트릿",
  "클래식",
  "스포티",
  "Y2K",
];

type Props = {
  styles: string[];
  onToggle: (style: string) => void;
  error: string | null;
};

const StyleSection = memo(({ styles, onToggle, error }: Props) => (
  <div className="mt-10">
    <div className="mb-2 flex items-center justify-between">
      <span className="font-medium text-[13px]">선호 스타일</span>
      <span className="text-[11px] text-gray-400">
        최대 2개 선택 가능합니다.
      </span>
    </div>

    <div className="grid grid-cols-5 gap-2">
      {STYLE_OPTIONS.map((style) => (
        <button
          key={style}
          type="button"
          onClick={() => onToggle(style)}
          className={`
            h-10 px-2 text-[12px] border rounded-[5px] whitespace-nowrap
            flex items-center justify-center
            ${styles.includes(style) ? "border-black bg-black text-white" : ""}
          `}
        >
          {style}
        </button>
      ))}
    </div>

    {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}
  </div>
));

StyleSection.displayName = "StyleSection";
export default StyleSection;
