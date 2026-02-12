"use client";

import Image from "next/image";
import { memo, ReactNode } from "react";

type Props = {
  title: string;
  onBack: () => void;
  onSubmit?: () => void;
  formId?: string;
  submitDisabled?: boolean;
  rightSlot?: ReactNode;
};

const PostFormHeader = memo(function PostFormHeader({
  title,
  onBack,
  onSubmit,
  formId,
  submitDisabled = false,
  rightSlot,
}: Props) {
  return (
    <header className="fixed top-0 left-1/2 z-10 flex h-14 w-full max-w-95 -translate-x-1/2 items-center bg-white">
      <div className="flex w-full items-center justify-between px-4">
        {/* 뒤로가기 */}
        <button type="button" onClick={onBack} aria-label="뒤로가기">
          <Image src="/icons/back.svg" alt="" width={24} height={24} />
        </button>

        {/* 타이틀 */}
        <h1 className="text-[14px] font-semibold">{title}</h1>

        {/* 완료 버튼 */}
        {rightSlot ?? (
          <button
            type={formId ? "submit" : "button"}
            form={formId}
            onClick={formId ? undefined : onSubmit}
            disabled={submitDisabled}
            className={`text-[14px] font-semibold ${
              submitDisabled ? "text-gray-400" : "text-black"
            }`}
          >
            완료
          </button>
        )}
      </div>
    </header>
  );
});

export default PostFormHeader;
