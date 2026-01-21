// hooks/useGender.ts
import { useCallback, useState } from "react";
import type { ChangeHandler } from "react-hook-form";

export function useGender(onChange: ChangeHandler) {
  const [hasGender, setHasGender] = useState(false);

  const handleGenderChange: ChangeHandler = useCallback(
    (e) => {
      setHasGender(!!e.target?.value);
      onChange(e);
    },
    [onChange],
  );

  return { hasGender, handleGenderChange };
}
