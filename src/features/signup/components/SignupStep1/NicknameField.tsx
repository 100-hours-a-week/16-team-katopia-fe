import { memo, useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  register: UseFormRegisterReturn;
  nickname: string;
  onChangeCapture?: React.FormEventHandler<HTMLInputElement>;
  error?: string;
  duplicateError: string | null;
  duplicateSuccess: string | null;
  onDuplicateCheck: (nickname: string) => boolean | void | Promise<boolean>;
};

const NicknameField = memo(
  ({
    register,
    nickname,
    onChangeCapture,
    error,
    duplicateError,
    duplicateSuccess,
    onDuplicateCheck,
  }: Props) => {
    const [overLimit, setOverLimit] = useState(false);

    return (
      <div className="mt-15">
        <label className="mb-1 block text-sm font-medium">
          닉네임<span className="text-red-500">*</span>
        </label>

        <p className="mb-2 text-xs text-muted-foreground">
          2자 이상 20자 이하, 특수문자(._)만 사용 가능
        </p>

        <div className="flex gap-2">
          <Input
            {...register}
            maxLength={20}
            onBeforeInput={(e) => {
              const input = e.target as HTMLInputElement;

              if (input.value.length >= 20) {
                e.preventDefault(); // 입력 차단
                setOverLimit(true); // 헬퍼 ON
              }
            }}
            onChange={(e) => {
              // ✅ 20자 미만으로 돌아오면 즉시 헬퍼 OFF
              if (e.currentTarget.value.length < 20) {
                setOverLimit(false);
              }

              register.onChange(e); // RHF 동기화
            }}
            onChangeCapture={onChangeCapture}
            placeholder="닉네임을 입력해주세요."
            className="placeholder:text-[12px] text-[12px]"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => onDuplicateCheck(nickname)}
            disabled={!nickname}
          >
            중복 확인
          </Button>
        </div>

        {/* 🔥 헬퍼 텍스트 우선순위 */}
        {overLimit ? (
          <p className="mt-2 text-[11px] text-red-500">
            닉네임은 최대 20자까지 입력할 수 있습니다.
          </p>
        ) : duplicateError ? (
          <p className="mt-2 text-[11px] text-red-500">{duplicateError}</p>
        ) : duplicateSuccess ? (
          <p className="mt-2 text-[11px] text-green-600">{duplicateSuccess}</p>
        ) : (
          error && <p className="mt-2 text-[11px] text-red-500">{error}</p>
        )}
      </div>
    );
  },
);

NicknameField.displayName = "NicknameField";
export default NicknameField;
