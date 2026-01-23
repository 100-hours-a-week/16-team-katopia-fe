import { useCallback, useRef, useState } from "react";
import type { UseFormTrigger, FieldValues, Path } from "react-hook-form";
import { API_BASE_URL } from "@/src/config/api";

export function useNicknameHandlers<T extends FieldValues>(
  trigger: UseFormTrigger<T>,
  nicknamePath: Path<T>, // 🔥 핵심
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

  const handleDuplicateCheck = useCallback(
    async (nickname: string) => {
      setDuplicateError(null);
      setDuplicateSuccess(null);

      // ✅ 타입 완벽
      const isValid = await trigger(nicknamePath);
      if (!isValid) {
        setIsNicknameVerified(false);
        setDuplicateError("닉네임 형식을 확인해주세요.");
        return;
      }

      lastVerifiedNicknameRef.current = nickname;

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

        if (!res.ok) throw new Error();

        const payload = (await res.json()) as {
          data?: { isDuplicated?: boolean };
        };

        if (payload.data?.isDuplicated) {
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
    [trigger, nicknamePath],
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
