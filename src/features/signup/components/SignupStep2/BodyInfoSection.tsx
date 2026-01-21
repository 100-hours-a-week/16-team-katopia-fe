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
    <div className="mt-8 flex gap-4">
      <div className="flex-1">
        <label className="mb-1 block text-[13px] font-medium">키</label>
        <div className="relative">
          <Input
            value={heightValue}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="예: 176"
            onChange={(e) => onHeightChange(e.target.value)}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">
            cm
          </span>
        </div>
      </div>

      <div className="flex-1">
        <label className="mb-1 block text-[13px] font-medium">몸무게</label>
        <div className="relative">
          <Input
            ref={weightInputRef}
            value={weightValue}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="예: 68"
            onChange={(e) => onWeightChange(e.target.value)}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm">
            kg
          </span>
        </div>
      </div>
    </div>
  ),
);

BodyInfoSection.displayName = "BodyInfoSection";
export default BodyInfoSection;
