"use client";

export default function VoteSubmitButton({ disabled }: { disabled: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex h-14 w-full items-center justify-center rounded-full text-[15px] font-semibold text-white ${
        disabled ? "bg-gray-300" : "bg-black"
      }`}
    >
      작성
    </button>
  );
}
