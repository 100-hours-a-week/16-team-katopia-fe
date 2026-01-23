"use client";

import Image from "next/image";

type Props = {
  title: string;
  onBack: () => void;
  onSubmit?: () => void;
  submitDisabled?: boolean;
};

export default function PostFormHeader({
  title,
  onBack,
  onSubmit,
  submitDisabled = false,
}: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex h-14 items-center justify-center  bg-white">
      <div className="flex w-full max-w-95 items-center justify-between px-4">
        {/* 뒤로가기 */}
        <button type="button" onClick={onBack} aria-label="뒤로가기">
          <Image src="/icons/back.svg" alt="" width={24} height={24} />
        </button>

        {/* 타이틀 */}
        <h1 className="text-[14px] font-semibold">{title}</h1>

        {/* 완료 버튼 */}
        {
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled}
            className={`text-[14px] font-semibold ${
              submitDisabled ? "text-gray-400" : "text-black"
            }`}
          >
            완료
          </button>
        }
      </div>
    </header>
  );
}
