import { useCallback, useRef, useState } from "react";
import type { UseFormTrigger } from "react-hook-form";
import { API_BASE_URL } from "@/src/config/api";

/** SignupStep1 폼 값 타입 */
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

  /** 닉네임 입력 시 */
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

  /** 닉네임 중복 검사 */
  const handleDuplicateCheck = useCallback(
    async (nickname: string) => {
      setDuplicateError(null);
      setDuplicateSuccess(null);

      /** 1️⃣ Zod validation */
      const isValid = await trigger("nickname");
      if (!isValid) {
        setIsNicknameVerified(false);
        setDuplicateError("닉네임 형식을 확인해주세요.");
        return;
      }

      lastVerifiedNicknameRef.current = nickname;

      console.log(encodeURIComponent(nickname));

      console.log(API_BASE_URL);

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/members/check?nickname=${encodeURIComponent(
            nickname,
          )}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        if (!res.ok) {
          throw new Error(`닉네임 확인 실패 (${res.status})`);
        }

        const payload = (await res.json()) as {
          data?: { isDuplicated?: boolean };
        };

        const isDuplicated = payload.data?.isDuplicated ?? true;

        if (isDuplicated) {
          setIsNicknameVerified(false);
          setDuplicateError("이미 사용 중인 닉네임입니다.");
          return;
        }

        setIsNicknameVerified(true);
        setDuplicateSuccess("사용 가능한 닉네임입니다.");
      } catch {
        setIsNicknameVerified(false);
        setDuplicateError("닉네임 중복 검사에 실패했습니다.");
      }
    },
    [trigger],
  );

  return {
    isNicknameVerified,
    hasNicknameValue,
    duplicateError,
    duplicateSuccess,
    handleNicknameChangeCapture,
    handleDuplicateCheck,
  };
}
