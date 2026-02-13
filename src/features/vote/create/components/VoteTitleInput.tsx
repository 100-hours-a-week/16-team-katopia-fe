"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_TITLE_LENGTH = 20;

type Props = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onValidityChange?: (valid: boolean) => void;
  onDirtyChange?: (dirty: boolean) => void;
  maxLength?: number;
};

export default function VoteTitleInput({
  inputRef,
  onValidityChange,
  onDirtyChange,
  maxLength = MAX_TITLE_LENGTH,
}: Props) {
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const lastValidityRef = useRef<boolean | null>(null);
  const lastDirtyRef = useRef<boolean | null>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const len = inputRef.current?.value.length ?? 0;
    if (countRef.current) {
      countRef.current.textContent = `${len}/${maxLength}`;
    }
  }, [inputRef, maxLength]);

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const target = e.currentTarget;
      let value = target.value;

      if (value.length > maxLength) {
        value = value.slice(0, maxLength);
        target.value = value;
        setIsOverLimit(true);
        setShowHelper(true);
      } else if (isOverLimit || showHelper) {
        setIsOverLimit(false);
        setShowHelper(false);
      }

      const trimmedLength = value.trim().length;
      const valid = trimmedLength > 0 && value.length <= maxLength;
      if (lastValidityRef.current !== valid) {
        lastValidityRef.current = valid;
        onValidityChange?.(valid);
      }

      const dirty = value.length > 0;
      if (lastDirtyRef.current !== dirty) {
        lastDirtyRef.current = dirty;
        onDirtyChange?.(dirty);
      }

      if (countRef.current) {
        countRef.current.textContent = `${value.length}/${maxLength}`;
      }
    },
    [isOverLimit, maxLength, onDirtyChange, onValidityChange, showHelper],
  );

  return (
    <div className="mt-8">
      <p className="text-[14px] font-semibold text-[#121212]">투표 제목</p>
      <input
        type="text"
        placeholder="*제목을 입력해주세요. (최대 20자)"
        ref={inputRef}
        onInput={handleInput}
        maxLength={maxLength}
        className={`mt-2 w-full border-b pb-2 text-[13px] text-[#121212] placeholder:text-gray-300 focus:outline-none ${
          isOverLimit ? "border-red-500" : "border-gray-300 focus:border-black"
        }`}
      />
      <p className="mt-2 text-right text-[11px] text-gray-400">
        <span ref={countRef}>0/{maxLength}</span>
      </p>
      {showHelper && (
        <p className="mt-2 text-[11px] text-[#ff5a5a]">
          최대 {maxLength}자까지 입력할 수 있어요.
        </p>
      )}
    </div>
  );
}
