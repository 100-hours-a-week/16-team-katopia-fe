// hooks/useBodyInfo.ts
import { useCallback, useRef, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";

type Field = "height" | "weight";

export function useBodyInfo(setValue: UseFormSetValue<any>) {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const weightInputRef = useRef<HTMLInputElement | null>(null);

  const handleNumericChange = useCallback(
    (field: Field, raw: string, focusNext?: () => void) => {
      const digits = raw.replace(/\D/g, "").slice(0, 3);
      if (!digits) {
        setValue(field, "");
        field === "height" ? setHeight("") : setWeight("");
        return;
      }

      const value = String(parseInt(digits, 10));
      setValue(field, value, { shouldDirty: true, shouldValidate: true });

      field === "height" ? setHeight(value) : setWeight(value);
      if (value.length === 3 && focusNext) focusNext();
    },
    [setValue],
  );

  return {
    height,
    weight,
    weightInputRef,
    onHeightChange: (v: string) =>
      handleNumericChange("height", v, () => weightInputRef.current?.focus()),
    onWeightChange: (v: string) => handleNumericChange("weight", v),
  };
}
