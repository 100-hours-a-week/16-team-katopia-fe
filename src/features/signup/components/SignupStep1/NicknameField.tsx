import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useController, type Control, type FieldPath } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SignupStep1Values } from "./schema";

type NicknameFieldValues = { nickname?: string };

type Props<T extends NicknameFieldValues = SignupStep1Values> = {
  control: Control<T>;
  duplicateError: string | null;
  duplicateSuccess: string | null;
  onDuplicateCheck: (nickname: string) => boolean | Promise<boolean>;
  isChecking: boolean;
  disableDuplicateCheck?: boolean;
  initialNickname?: string | null;
  showRequiredMark?: boolean;
};

type NicknameInputRowProps = {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  inputError?: string;
  duplicateError: string | null;
  duplicateSuccess: string | null;
  onDuplicateCheck: (nickname: string) => boolean | Promise<boolean>;
  isChecking: boolean;
  disableDuplicateCheck?: boolean;
  initialNickname?: string | null;
};

type NicknameInputProps = {
  value: string;
  onCommitChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLocalValueChange: (next: string) => void;
  onOverLimitChange: (next: boolean) => void;
};

const NicknameInput = memo(
  ({
    value,
    onCommitChange,
    onLocalValueChange,
    onOverLimitChange,
  }: NicknameInputProps) => {
    const [localValue, setLocalValue] = useState(value);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalValue(value);
      onLocalValueChange(value);
    }, [value, onLocalValueChange]);

    useEffect(() => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (localValue !== value) {
          onCommitChange({
            target: { value: localValue },
          } as React.ChangeEvent<HTMLInputElement>);
        }
      }, 200);

      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, [localValue, onCommitChange, value]);

    return (
      <Input
        value={localValue}
        maxLength={20}
        onChange={(event) => {
          const next = event.currentTarget.value;
          onOverLimitChange(next.length >= 20);
          onLocalValueChange(next);
          setLocalValue(next);
        }}
        placeholder="닉네임을 입력해주세요."
        className="placeholder:text-[12px] text-[12px]"
      />
    );
  },
);

NicknameInput.displayName = "NicknameInput";

const DuplicateCheckButton = memo(
  ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
    >
      중복 확인
    </Button>
  ),
);

DuplicateCheckButton.displayName = "DuplicateCheckButton";

const NicknameInputRow = memo(
  ({
    value,
    onChange,
    inputError,
    duplicateError,
    duplicateSuccess,
    onDuplicateCheck,
    isChecking,
    disableDuplicateCheck,
    initialNickname,
  }: NicknameInputRowProps) => {
    const [overLimit, setOverLimit] = useState(false);
    const [lastCheckedNickname, setLastCheckedNickname] = useState<
      string | null
    >(null);
    const latestInputRef = useRef(value);

    const handleLocalValueChange = useCallback((next: string) => {
      latestInputRef.current = next;
    }, []);

    useEffect(() => {
      latestInputRef.current = value;
    }, [value]);

    const trimmedValue = value.trim();
    const hasWhitespace = /\s/.test(value);
    const trimmedInitial = initialNickname?.trim() ?? "";

    const needRecheck = !lastCheckedNickname || lastCheckedNickname !== value;

    const isDuplicateDisabled =
      Boolean(disableDuplicateCheck) ||
      !trimmedValue ||
      (trimmedInitial && trimmedInitial === trimmedValue) ||
      isChecking ||
      !needRecheck;

    const handleDuplicateClick = useCallback(async () => {
      const currentNickname = latestInputRef.current;
      const ok = await onDuplicateCheck(currentNickname);
      if (ok) setLastCheckedNickname(currentNickname);
    }, [onDuplicateCheck]);

    return (
      <>
        <div className="flex gap-2">
          <NicknameInput
            value={value}
            onCommitChange={onChange}
            onLocalValueChange={handleLocalValueChange}
            onOverLimitChange={setOverLimit}
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
        ) : hasWhitespace ? (
          <p className="mt-2 text-[11px] text-red-500">
            공백은 입력할 수 없습니다.
          </p>
        ) : duplicateError && !needRecheck ? (
          <p className="mt-2 text-[11px] text-red-500">{duplicateError}</p>
        ) : duplicateSuccess && !needRecheck ? (
          <p className="mt-2 text-[11px] text-green-600">{duplicateSuccess}</p>
        ) : (
          inputError && (
            <p className="mt-2 text-[11px] text-red-500">{inputError}</p>
          )
        )}
      </>
    );
  },
);

NicknameInputRow.displayName = "NicknameInputRow";

export default function NicknameField<T extends NicknameFieldValues>({
  control,
  duplicateError,
  duplicateSuccess,
  onDuplicateCheck,
  isChecking,
  disableDuplicateCheck,
  initialNickname,
  showRequiredMark = true,
}: Props<T>) {
  const {
    field,
    fieldState: { error },
  } = useController<T>({
    name: "nickname" as FieldPath<T>,
    control,
  });

  return (
    <div className="mt-15">
      <label className="mb-1 block text-sm font-medium">
        닉네임{showRequiredMark && <span className="text-red-500">*</span>}
      </label>

      <p className="mb-2 text-xs text-muted-foreground">
        2자 이상 20자 이하, 특수문자(._)만 사용 가능
      </p>

      <NicknameInputRow
        value={field.value ?? ""}
        onChange={field.onChange}
        inputError={error?.message}
        duplicateError={duplicateError}
        duplicateSuccess={duplicateSuccess}
        onDuplicateCheck={onDuplicateCheck}
        isChecking={isChecking}
        disableDuplicateCheck={disableDuplicateCheck}
        initialNickname={initialNickname}
      />
    </div>
  );
}
