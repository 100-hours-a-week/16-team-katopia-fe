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
    <header className="absolute left-0 top-0 flex h-14 items-center px-4">
      <Image src={logoSrc} alt={alt} width={width} height={height} priority />
    </header>
  );
}
