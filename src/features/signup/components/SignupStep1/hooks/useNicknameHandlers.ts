import { useCallback, useRef, useState } from "react";
import type { UseFormTrigger } from "react-hook-form";

/** 🔥 SignupStep1 폼 값 타입 */
type SignupStep1Values = {
  nickname: string;
};

export function useNicknameHandlers(
  trigger: UseFormTrigger<SignupStep1Values>,
) {
  const lastVerifiedNicknameRef = useRef<string>("");

  const [isNicknameVerified, setIsNicknameVerified] = useState(false);
  const [hasNicknameValue, setHasNicknameValue] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [duplicateSuccess, setDuplicateSuccess] = useState<string | null>(null);

  const handleNicknameChangeCapture = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const value = (e.target as HTMLInputElement).value;

      if (value !== lastVerifiedNicknameRef.current) {
        setIsNicknameVerified(false);
        setDuplicateError(null);
        setDuplicateSuccess(null);
      }

      setHasNicknameValue(value.length > 0);
    },
    [],
  );

  const handleDuplicateCheck = useCallback(async () => {
    setDuplicateError(null);
    setDuplicateSuccess(null);

    /** ✅ 이제 타입 안전 */
    const isValid = await trigger("nickname");
    if (!isValid) {
      setIsNicknameVerified(false);
      setDuplicateError("닉네임 형식을 확인해주세요.");
      return;
    }

    const input = document.querySelector(
      'input[name="nickname"]',
    ) as HTMLInputElement | null;

    if (input) {
      lastVerifiedNicknameRef.current = input.value;
    }

    // TODO: API 연동
    setIsNicknameVerified(true);
    setDuplicateSuccess("사용 가능한 닉네임입니다.");
  }, [trigger]);

  return {
    isNicknameVerified,
    hasNicknameValue,
    duplicateError,
    duplicateSuccess,
    handleNicknameChangeCapture,
    handleDuplicateCheck,
  };
}
