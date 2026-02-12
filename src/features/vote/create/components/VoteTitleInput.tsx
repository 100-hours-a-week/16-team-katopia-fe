"use client";

export default function VoteTitleInput({
  value,
  onChange,
  isOverLimit,
  helperText,
}: {
  value: string;
  onChange: (next: string) => void;
  isOverLimit: boolean;
  helperText?: string | null;
}) {
  return (
    <div className="mt-8">
      <p className="text-[14px] font-semibold text-[#121212]">투표 제목</p>
      <input
        type="text"
        placeholder="*제목을 입력해주세요. (최대 20자)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 w-full border-b pb-2 text-[13px] text-[#121212] placeholder:text-gray-300 focus:outline-none ${
          isOverLimit ? "border-red-500" : "border-gray-300 focus:border-black"
        }`}
      />
      {helperText && (
        <p className="mt-2 text-[11px] text-[#ff5a5a]">{helperText}</p>
      )}
    </div>
  );
}
