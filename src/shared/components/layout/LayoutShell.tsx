"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

const HIDE_BOTTOM_NAV_PATHS = ["/"];

type Props = {
  children: ReactNode;
};

export default function LayoutShell({ children }: Props) {
  const pathname = usePathname();
  const hideBottomNav = HIDE_BOTTOM_NAV_PATHS.includes(pathname ?? "");

  return (
    <>
      <div className="mx-auto min-h-screen w-full max-w-97.5 bg-white">
        {children}
      </div>
      {!hideBottomNav && <BottomNav />}
    </>
  );
}
