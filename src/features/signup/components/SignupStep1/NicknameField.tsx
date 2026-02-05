import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useController, type Control } from "react-hook-form";
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
    return (
      <div className="mt-15">
        <label className="mb-1 block text-sm font-medium">
          닉네임<span className="text-red-500">*</span>
        </label>

        <p className="mb-2 text-xs text-muted-foreground">
          2자 이상 20자 이하, 특수문자(._)만 사용 가능
        </p>

        <NicknameInputSection
          control={control}
          duplicateError={duplicateError}
          duplicateSuccess={duplicateSuccess}
          onDuplicateCheck={onDuplicateCheck}
          isChecking={isChecking}
        />
      </div>
    );
  },
);

NicknameField.displayName = "NicknameField";
export default NicknameField;

const NicknameInputSection = memo(
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

    const nickname = field.value ?? "";

    const [overLimit, setOverLimit] = useState(false);
    const [lastCheckedNickname, setLastCheckedNickname] = useState<
      string | null
    >(null);
    const latestNicknameRef = useRef(nickname);

    const needRecheck = useMemo(() => {
      if (!lastCheckedNickname) return true;
      return lastCheckedNickname !== nickname;
    }, [lastCheckedNickname, nickname]);

    useEffect(() => {
      latestNicknameRef.current = nickname;
    }, [nickname]);

    const handleDuplicateClick = useCallback(async () => {
      const currentNickname = latestNicknameRef.current;
      const ok = await onDuplicateCheck(currentNickname);
      if (ok) setLastCheckedNickname(currentNickname);
    }, [onDuplicateCheck]);

    const isDuplicateDisabled = useMemo(() => {
      return !nickname || isChecking || !needRecheck;
    }, [nickname, isChecking, needRecheck]);

    return (
      <>
        <div className="flex gap-2">
          <NicknameInput
            value={nickname}
            onChange={field.onChange}
            onOverLimit={setOverLimit}
          />

          <DuplicateCheckButton
            disabled={isDuplicateDisabled}
            onClick={handleDuplicateClick}
          />
        </div>

        {overLimit ? (
          <p className="mt-2 text-[11px] text-red-500">
            닉네임은 최대 20자까지 입력할 수 있습니다.
          </p>
        ) : duplicateError && !needRecheck ? (
          <p className="mt-2 text-[11px] text-red-500">{duplicateError}</p>
        ) : duplicateSuccess && !needRecheck ? (
          <p className="mt-2 text-[11px] text-green-600">{duplicateSuccess}</p>
        ) : (
          error && (
            <p className="mt-2 text-[11px] text-red-500">{error.message}</p>
          )
        )}
      </>
    );
  },
);

NicknameInputSection.displayName = "NicknameInputSection";

const DuplicateCheckButton = memo(
  ({
    disabled,
    onClick,
  }: {
    disabled: boolean;
    onClick: () => void;
  }) => {
    return (
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={onClick}
      >
        중복 확인
      </Button>
    );
  },
);

DuplicateCheckButton.displayName = "DuplicateCheckButton";

const NicknameInput = memo(
  ({
    value,
    onChange,
    onOverLimit,
  }: {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onOverLimit: (next: boolean) => void;
  }) => {
    const [localValue, setLocalValue] = useState(value);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    useEffect(() => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (localValue !== value) {
          onChange({
            target: { value: localValue },
          } as React.ChangeEvent<HTMLInputElement>);
        }
      }, 200);

      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, [localValue, onChange, value]);

    return (
      <Input
        maxLength={20}
        onBeforeInput={(e) => {
          const input = e.target as HTMLInputElement;
          if (input.value.length >= 20) {
            e.preventDefault();
            onOverLimit(true);
          }
        }}
        onChange={(e) => {
          if (e.currentTarget.value.length < 20) {
            onOverLimit(false);
          }
          setLocalValue(e.currentTarget.value);
        }}
        value={localValue}
        placeholder="닉네임을 입력해주세요."
        className="placeholder:text-[12px] text-[12px]"
      />
    );
  },
);

NicknameInput.displayName = "NicknameInput";
