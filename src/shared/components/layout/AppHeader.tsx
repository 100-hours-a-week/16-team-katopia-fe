"use client";

import Image from "next/image";

interface AppHeaderProps {
  logoSrc?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export default function AppHeader({
  logoSrc = "/images/logo.png",
  alt = "FITCHECK",
  width = 96,
  height = 24,
}: AppHeaderProps) {
  return (
    <header className="absolute left-0 top-0 flex h-14 w-full items-center justify-between px-4">
      <Image src={logoSrc} alt={alt} width={width} height={height} priority />

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="알림"
          className="flex h-9 w-9 items-center justify-center"
        >
          <Image src="/icons/bell.svg" alt="" width={20} height={20} />
        </button>
        <button
          type="button"
          aria-label="메시지"
          className="flex h-9 w-9 items-center justify-center"
        >
          <Image src="/icons/home_send.svg" alt="" width={20} height={20} />
        </button>
      </div>
    </header>
  );
}
