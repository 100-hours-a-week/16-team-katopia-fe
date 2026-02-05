import { memo, useMemo } from "react";
import { useFormState, useWatch, type Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { SignupStep1Values } from "./schema";

type Props = {
  control: Control<SignupStep1Values>;
  verifiedNickname: string;
};

const SubmitButton = memo(({ control, verifiedNickname }: Props) => {
  // ✅ nickname 필드만 에러 구독
  const { errors } = useFormState<SignupStep1Values>({
    control,
    name: "nickname",
  });
  const nickname = useWatch({ control, name: "nickname" }) ?? "";

  const disabled = useMemo(() => {
    return (
      !!errors.nickname || !nickname || nickname !== verifiedNickname
    );
  }, [errors.nickname, nickname, verifiedNickname]);

  return <NextButton disabled={disabled} />;
});

SubmitButton.displayName = "SubmitButton";
export default SubmitButton;

const NextButton = memo(({ disabled }: { disabled: boolean }) => {
  return (
    <Button
      type="submit"
      disabled={disabled}
      className={`mt-40 h-14 w-full text-base font-semibold ${
        disabled
          ? "bg-gray-200 text-gray-500 hover:bg-gray-200"
          : "bg-black text-white hover:bg-black"
      }`}
    >
      다음
    </Button>
  );
});

NextButton.displayName = "NextButton";
