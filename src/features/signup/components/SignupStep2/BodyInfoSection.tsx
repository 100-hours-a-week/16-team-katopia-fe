"use client";

import { memo, type RefObject } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  heightValue: string;
  weightValue: string;
  onHeightChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  weightInputRef: RefObject<HTMLInputElement | null>;
  heightError?: string | null;
  weightError?: string | null;
};

const BodyInfoSection = memo(
  ({
    heightValue,
    weightValue,
    onHeightChange,
    onWeightChange,
    weightInputRef,
    heightError,
    weightError,
  }: Props) => (
    <div className="mt-10 flex items-center justify-center gap-8">
      <div>
        <label className="mb-1 block text-[13px] font-medium">키</label>
        <div className="inline-flex items-center gap-2">
          <Input
            value={heightValue}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="키를 입력해주세요."
            className="text-right text-[12px] placeholder:text-right placeholder:text-[11px] placeholder:text-gray-200"
            onChange={(e) => onHeightChange(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">cm</span>
        </div>
        <div className="mt-1 min-h-3.5">
          {heightError && (
            <p className="whitespace-nowrap text-[10px] text-red-500">
              {heightError}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[13px] font-medium">몸무게</label>
        <div className="inline-flex items-center gap-2">
          <Input
            ref={weightInputRef}
            value={weightValue}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="몸무게를 입력해주세요."
            className="w-full  text-right text-[13px] placeholder:text-[11px] placeholder:text-gray-200"
            onChange={(e) => onWeightChange(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">kg</span>
        </div>
        <div className="mt-1 min-h-3.5">
          {weightError && (
            <p className="whitespace-nowrap text-[10px] text-red-500">
              {weightError}
            </p>
          )}
        </div>
      </div>
    </div>
  ),
);

BodyInfoSection.displayName = "BodyInfoSection";
export default BodyInfoSection;
