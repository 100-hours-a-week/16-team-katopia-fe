// hooks/useBodyInfo.ts
import { useCallback, useRef, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";

type Field = "height" | "weight";
type BodyInfoFields = {
  height?: string;
  weight?: string;
};

export function useBodyInfo(setValue: UseFormSetValue<BodyInfoFields>) {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const weightInputRef = useRef<HTMLInputElement | null>(null);

  const handleNumericChange = useCallback(
    (field: Field, raw: string, focusNext?: () => void) => {
      const digits = raw.replace(/\D/g, "").slice(0, 3);
      if (!digits) {
        setValue(field, "");
        if (field === "height") {
          setHeight("");
        } else {
          setWeight("");
        }
        return;
      }

      const value = String(parseInt(digits, 10));
      setValue(field, value, { shouldDirty: true, shouldValidate: true });

      if (field === "height") {
        setHeight(value);
      } else {
        setWeight(value);
      }
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
