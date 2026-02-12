"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function VoteCreateHeader({ onBack }: { onBack?: () => void }) {
  const router = useRouter();

  return (
    <header className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={() => (onBack ? onBack() : router.back())}
        className="absolute left-0"
      >
        <Image src="/icons/back.svg" alt="뒤로가기" width={24} height={24} />
      </button>
      <p className="text-[14px] font-semibold text-[#121212]">새 투표</p>
    </header>
  );
}
