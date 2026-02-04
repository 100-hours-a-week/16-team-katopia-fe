import { memo, useMemo, useState } from "react";
import { useController, useWatch, type Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SignupStep1Values } from "./schema";

type Props = {
  control: Control<SignupStep1Values>;
  duplicateError: string | null;
  duplicateSuccess: string | null;
  onDuplicateCheck: (nickname: string) => boolean | Promise<boolean>;
  isChecking: boolean;
};

const NicknameField = memo(
  ({
    control,
    duplicateError,
    duplicateSuccess,
    onDuplicateCheck,
    isChecking,
  }: Props) => {
    const {
      field,
      fieldState: { error },
    } = useController({ name: "nickname", control });

    const nickname = useWatch({ name: "nickname", control });

    const [overLimit, setOverLimit] = useState(false);
    const [lastCheckedNickname, setLastCheckedNickname] = useState<
      string | null
    >(null);

    const needRecheck = useMemo(() => {
      if (!lastCheckedNickname) return true;
      return lastCheckedNickname !== nickname;
    }, [lastCheckedNickname, nickname]);

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
            {...field}
            maxLength={20}
            onBeforeInput={(e) => {
              const input = e.target as HTMLInputElement;
              if (input.value.length >= 20) {
                e.preventDefault();
                setOverLimit(true);
              }
            }}
            onChange={(e) => {
              if (e.currentTarget.value.length < 20) {
                setOverLimit(false);
              }
              field.onChange(e);
            }}
            placeholder="닉네임을 입력해주세요."
            className="placeholder:text-[12px] text-[12px]"
          />

          <Button
            type="button"
            variant="outline"
            disabled={!nickname || isChecking || !needRecheck}
            onClick={async () => {
              const ok = await onDuplicateCheck(nickname);
              if (ok) setLastCheckedNickname(nickname);
            }}
          >
            중복 확인
          </Button>
        </div>

        {overLimit ? (
          <p className="mt-2 text-[11px] text-red-500">
            닉네임은 최대 20자까지 입력할 수 있습니다.
          </p>
        ) : duplicateError ? (
          <p className="mt-2 text-[11px] text-red-500">{duplicateError}</p>
        ) : duplicateSuccess && !needRecheck ? (
          <p className="mt-2 text-[11px] text-green-600">{duplicateSuccess}</p>
        ) : (
          error && (
            <p className="mt-2 text-[11px] text-red-500">{error.message}</p>
          )
        )}
      </div>
    );
  },
);

NicknameField.displayName = "NicknameField";
export default NicknameField;
