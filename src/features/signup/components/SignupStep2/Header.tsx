"use client";

import { memo } from "react";
import Image from "next/image";

type Props = {
  onBack?: () => void;
};

const Header = memo(({ onBack }: Props) => (
  <div className="relative flex items-center justify-center h-12">
    {onBack && (
      <button type="button" onClick={onBack} className="absolute left-0">
        <Image src="/icons/back.svg" alt="뒤로 가기" width={24} height={24} />
      </button>
    )}
    <h1 className="text-lg font-semibold">가입하기</h1>
  </div>
));

Header.displayName = "Header";
export default Header;
