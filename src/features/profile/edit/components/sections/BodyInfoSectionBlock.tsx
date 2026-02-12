"use client";

import { memo, useCallback, useRef } from "react";
import { useController, useFormContext, useFormState } from "react-hook-form";

import BodyInfoSection from "@/src/features/signup/components/SignupStep2/BodyInfoSection";
import type { ProfileEditFormValues } from "../../hooks/useProfileEdit";

const BodyInfoSectionBlock = memo(() => {
  const { control, setValue } = useFormContext<ProfileEditFormValues>();
  const { field: heightField } = useController({ name: "height", control });
  const { field: weightField } = useController({ name: "weight", control });
  const { errors } = useFormState<ProfileEditFormValues>({
    name: ["height", "weight"],
  });

  const weightInputRef = useRef<HTMLInputElement | null>(null);

  const handleNumericChange = useCallback(
    (field: "height" | "weight", raw: string, focusNext?: () => void) => {
      const digits = raw.replace(/\D/g, "").slice(0, 3);
      const normalized = digits ? String(parseInt(digits, 10)) : "";

      setValue(field, normalized, { shouldDirty: true, shouldValidate: true });

      if (normalized.length === 3 && focusNext) focusNext();
    },
    [setValue],
  );

  const onHeightChange = useCallback(
    (value: string) =>
      handleNumericChange("height", value, () =>
        weightInputRef.current?.focus(),
      ),
    [handleNumericChange],
  );

  const onWeightChange = useCallback(
    (value: string) => handleNumericChange("weight", value),
    [handleNumericChange],
  );

  return (
    <section className="px-4">
      <BodyInfoSection
        heightValue={heightField.value ?? ""}
        weightValue={weightField.value ?? ""}
        onHeightChange={onHeightChange}
        onWeightChange={onWeightChange}
        weightInputRef={weightInputRef}
        heightError={errors.height?.message as string | undefined}
        weightError={errors.weight?.message as string | undefined}
        labelClassName="text-sm"
      />
    </section>
  );
});

BodyInfoSectionBlock.displayName = "BodyInfoSectionBlock";

export default BodyInfoSectionBlock;
