"use client";

import { memo, type RefObject } from "react";
import { Input } from "@/components/ui/input";

type Props = {
  heightValue: string;
  weightValue: string;
  onHeightChange: (value: string) => void;
  onWeightChange: (value: string) => void;
  weightInputRef: RefObject<HTMLInputElement | null>;
};

const BodyInfoSection = memo(
  ({
    heightValue,
    weightValue,
    onHeightChange,
    onWeightChange,
    weightInputRef,
  }: Props) => (
    <div className="mt-10 flex items-center justify-center gap-8">
      <div>
        <label className="mb-1 block text-[13px] font-medium">키</label>
        <div className="inline-flex items-center gap-2">
          <Input
            value={heightValue}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="예: 176"
            className="text-right text-[12px] placeholder:text-right placeholder:text-[13px] placeholder:text-[#d9d9d9]"
            onChange={(e) => onHeightChange(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">cm</span>
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
            placeholder="예: 68"
            className="w-full  text-right text-[13px] placeholder:text-[13px] placeholder:text-[#d9d9d9]"
            onChange={(e) => onWeightChange(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">kg</span>
        </div>
      </div>
    </div>
  ),
);

BodyInfoSection.displayName = "BodyInfoSection";
export default BodyInfoSection;
