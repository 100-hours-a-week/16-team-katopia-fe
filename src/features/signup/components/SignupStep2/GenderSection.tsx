"use client";

import { memo } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

type Props = {
  register: UseFormRegisterReturn;
  error?: string;
};

const GenderSection = memo(({ register, error }: Props) => (
  <div className="mt-10">
    <p className="mb-2 font-medium text-[13px]">
      성별 <span className="text-red-500 text-[16px]">*</span>
    </p>

    <div className="flex justify-center gap-12">
      <label className="flex items-center gap-2 text-[13px]">
        <input
          type="radio"
          value="male"
          className="accent-black"
          {...register}
        />
        남성
      </label>

      <label className="flex items-center gap-2 text-[13px]">
        <input
          type="radio"
          value="female"
          className="accent-black"
          {...register}
        />
        여성
      </label>
    </div>

    {error && <p className="mt-1 text-sm text-red-500">성별을 선택해주세요.</p>}
  </div>
));

GenderSection.displayName = "GenderSection";
export default GenderSection;
