import { useCallback, useState } from "react";
import type { UseFormTrigger, FieldValues, Path } from "react-hook-form";
import { API_BASE_URL } from "@/src/config/api";

export function useNicknameHandlers<T extends FieldValues>(
  trigger: UseFormTrigger<T>,
  nicknamePath: Path<T>, //
) {
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [duplicateSuccess, setDuplicateSuccess] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [verifiedNickname, setVerifiedNickname] = useState<string>("");

  const handleDuplicateCheck = useCallback(
    async (nickname: string) => {
      if (isChecking) return false;
      setIsChecking(true);
      setDuplicateError(null);
      setDuplicateSuccess(null);
      setVerifiedNickname("");

      // ✅ 타입 완벽
      const isValid = await trigger(nicknamePath);
      if (!isValid) {
        setDuplicateError("닉네임 형식을 확인해주세요.");
        setIsChecking(false);
        return false;
      }

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
          data?: { isAvailable?: boolean };
          isAvailable?: boolean;
        };

        const isAvailable =
          payload.data?.isAvailable ?? payload.isAvailable ?? null;

        if (isAvailable === true) {
          setVerifiedNickname(nickname);
          setDuplicateSuccess("사용 가능한 닉네임입니다.");
          setIsChecking(false);
          return true;
        }

        if (isAvailable === false) {
          setDuplicateError("이미 사용 중인 닉네임입니다.");
          setIsChecking(false);
          return false;
        }

        setDuplicateError("닉네임 형식을 확인해주세요.");
        setIsChecking(false);
        return false;
      } catch {
        setDuplicateError("닉네임 중복 검사에 실패했습니다.");
        setIsChecking(false);
        return false;
      }
    },
    [trigger, nicknamePath, isChecking],
  );

  return {
    verifiedNickname,
    duplicateError,
    duplicateSuccess,
    isChecking,
    handleDuplicateCheck,
  };
}
