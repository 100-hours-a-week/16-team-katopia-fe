"use client";

import { memo } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

type Props = {
  register: UseFormRegisterReturn;
  error?: string;
  maleValue?: string;
  femaleValue?: string;
  errorMessage?: string;
  showRequiredMark?: boolean;
  labelClassName?: string;
};

const GenderSection = memo(
  ({
    register,
    error,
    maleValue = "male",
    femaleValue = "female",
    errorMessage = "성별을 선택해주세요.",
    showRequiredMark = true,
    labelClassName = "text-[13px]",
  }: Props) => (
  <div className="mt-10">
    <p className={`mb-2 font-medium ${labelClassName}`}>
      성별{" "}
      {showRequiredMark && (
        <span className="text-red-500 text-[16px]">*</span>
      )}
    </p>

    <div className="flex justify-center gap-12">
      <label className="flex items-center gap-2 text-[13px]">
        <input
          type="radio"
          value={maleValue}
          className="accent-black"
          {...register}
        />
        남성
      </label>

      <label className="flex items-center gap-2 text-[13px]">
        <input
          type="radio"
          value={femaleValue}
          className="accent-black"
          {...register}
        />
        여성
      </label>
    </div>

    {error && <p className="mt-1 text-sm text-red-500">{errorMessage}</p>}
  </div>
),
);

GenderSection.displayName = "GenderSection";
export default GenderSection;
