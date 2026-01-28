"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import LoginBottomSheet from "@/src/features/home/components/LoginBottomsSheet";

const HIDE_BOTTOM_NAV_PATHS = ["/"];
const LOGIN_GUARD_PATHS = ["/post", "/vote", "/search", "/home"];

type Props = {
  children: ReactNode;
};

export default function LayoutShell({ children }: Props) {
  const pathname = usePathname();
  const hideBottomNav = HIDE_BOTTOM_NAV_PATHS.includes(pathname ?? "");
  const { ready, isAuthenticated } = useAuth();
  const [forceLogin, setForceLogin] = useState(false);
  const hasAlertedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleInvalid = () => {
      if (!hasAlertedRef.current) {
        hasAlertedRef.current = true;
        alert("인증 정보가 유효하지 않습니다. 다시 로그인해주세요.");
      }
      setForceLogin(true);
    };
    window.addEventListener("auth:invalid", handleInvalid);
    return () => window.removeEventListener("auth:invalid", handleInvalid);
  }, []);

  const shouldLock =
    ready &&
    !isAuthenticated &&
    (forceLogin || LOGIN_GUARD_PATHS.includes(pathname ?? ""));

  return (
    <>
      <div
        className={`mx-auto min-h-screen w-full max-w-97.5 bg-white ${
          hideBottomNav ? "" : "pb-20"
        }`}
      >
        {children}
      </div>
      {!hideBottomNav && <BottomNav />}
      {shouldLock && <LoginBottomSheet persist />}
    </>
  );
}
