"use client";

import { memo } from "react";
import { useFormContext, useFormState } from "react-hook-form";

import GenderSection from "@/src/features/signup/components/SignupStep2/GenderSection";
import type { ProfileEditFormValues } from "../../hooks/useProfileEdit";

const GenderSectionBlock = memo(() => {
  const { register } = useFormContext<ProfileEditFormValues>();
  const { errors } = useFormState<ProfileEditFormValues>({
    name: "gender",
  });

  return (
    <section className="px-4">
      <GenderSection
        register={register("gender")}
        error={errors.gender?.message}
        maleValue="MALE"
        femaleValue="FEMALE"
        labelClassName="text-sm"
      />
    </section>
  );
});

GenderSectionBlock.displayName = "GenderSectionBlock";

export default GenderSectionBlock;
