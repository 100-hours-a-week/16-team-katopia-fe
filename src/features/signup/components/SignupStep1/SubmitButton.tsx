import { memo, useMemo } from "react";
import { useFormState, type Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { SignupStep1Values } from "./schema";

type Props = {
  control: Control<SignupStep1Values>;
  isNicknameVerified: boolean;
};

const SubmitButton = memo(({ control, isNicknameVerified }: Props) => {
  // ✅ nickname 필드만 에러 구독
  const { errors } = useFormState<SignupStep1Values>({
    control,
    name: "nickname",
  });

  const disabled = useMemo(() => {
    return !!errors.nickname || !isNicknameVerified;
  }, [errors.nickname, isNicknameVerified]);

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

SubmitButton.displayName = "SubmitButton";
export default SubmitButton;
