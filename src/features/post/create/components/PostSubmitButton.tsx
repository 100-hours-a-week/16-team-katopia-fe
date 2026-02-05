import { useCallback, useEffect, useRef } from "react";
import { useFormContext, useFormState } from "react-hook-form";

import type { PostCreateValues } from "../schemas";

type Props = {
  disabled?: boolean;
  formId: string;
};

export default function PostSubmitButton({ disabled = false, formId }: Props) {
  const { control, getValues, watch } = useFormContext<PostCreateValues>();
  const { isSubmitting } = useFormState({ control });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const lastCanSubmitRef = useRef(false);

  const applyDisabled = useCallback(
    (canSubmit: boolean) => {
      const shouldDisable = !canSubmit || isSubmitting || disabled;
      const button = buttonRef.current;
      if (!button) return;
      button.disabled = shouldDisable;
      button.classList.toggle("text-gray-400", shouldDisable);
      button.classList.toggle("text-black", !shouldDisable);
    },
    [disabled, isSubmitting],
  );

  useEffect(() => {
    const current = getValues();
    const canSubmit =
      (current.imageObjectKeys?.length ?? 0) > 0 &&
      !!current.content?.trim();
    lastCanSubmitRef.current = canSubmit;
    applyDisabled(canSubmit);
  }, [applyDisabled, getValues]);

  useEffect(() => {
    const subscription = watch((values) => {
      const canSubmit =
        (values.imageObjectKeys?.length ?? 0) > 0 &&
        !!values.content?.trim();
      if (canSubmit === lastCanSubmitRef.current) return;
      lastCanSubmitRef.current = canSubmit;
      applyDisabled(canSubmit);
    });
    return () => subscription.unsubscribe();
  }, [applyDisabled, watch]);

  return (
    <button
      ref={buttonRef}
      type="submit"
      form={formId}
      className="text-[14px] font-semibold text-gray-400"
    >
      완료
    </button>
  );
}
