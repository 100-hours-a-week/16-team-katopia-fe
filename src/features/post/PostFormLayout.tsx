"use client";

import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function PostFormLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-white">
      {/* 상단 헤더 높이만큼 여백 확보 */}
      <div className="mx-auto w-full max-w-[480px] px-4 pt-14">{children}</div>
    </div>
  );
}
