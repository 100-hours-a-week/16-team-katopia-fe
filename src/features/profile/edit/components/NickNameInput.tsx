"use client";

import { memo } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  register: UseFormRegisterReturn;
  onChangeCapture?: React.FormEventHandler<HTMLInputElement>;
  error?: string;
  duplicateError: string | null;
  duplicateSuccess: string | null;
  onDuplicateCheck: () => void;
  disableDuplicateCheck?: boolean;
};

const NicknameInput = memo(
  ({
    register,
    onChangeCapture,
    error,
    duplicateError,
    duplicateSuccess,
    onDuplicateCheck,
    disableDuplicateCheck,
  }: Props) => (
    <div className="mt-10">
      <label className="mb-1 block text-sm font-medium">닉네임</label>

      <p className="mb-2 text-xs text-muted-foreground">
        2자 이상 20자 이하, 특수문자(._)만 사용 가능
      </p>

      <div className="flex gap-2">
        <Input
          {...register}
          onChangeCapture={onChangeCapture}
          placeholder="닉네임을 입력해주세요."
          className="placeholder:text-[12px] text-[12px]"
        />
        <Button
          type="button"
          variant="outline"
          onClick={onDuplicateCheck}
          disabled={disableDuplicateCheck}
        >
          중복 확인
        </Button>
      </div>

      {duplicateError ? (
        <p className="mt-2 text-[11px] text-red-500">{duplicateError}</p>
      ) : duplicateSuccess ? (
        <p className="mt-2 text-[11px] text-green-600">{duplicateSuccess}</p>
      ) : (
        error && <p className="mt-2 text-[11px] text-red-500">{error}</p>
      )}
    </div>
  ),
);

NicknameInput.displayName = "NicknameInput";
export default NicknameInput;
