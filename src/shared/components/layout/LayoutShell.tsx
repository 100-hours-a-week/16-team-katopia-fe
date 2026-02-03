"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import BottomNav from "./BottomNav";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { hasLoggedInFlag } from "@/src/lib/auth";
import LoginBottomSheet from "@/src/features/home/components/LoginBottomsSheet";

const HIDE_BOTTOM_NAV_PATHS = ["/", "/withdraw/success"];
const LOGIN_GUARD_PATHS = ["/post", "/vote", "/search", "/home"];
const LOGIN_GUARD_EXCLUDED_PATHS = ["/"];

type Props = {
  children: ReactNode;
};

export default function LayoutShell({ children }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hideBottomNav = HIDE_BOTTOM_NAV_PATHS.includes(pathname ?? "");
  const { ready, isAuthenticated, authInvalidated } = useAuth();
  const hasAlertedRef = useRef(false);
  const isPendingSignup = searchParams.get("status") === "PENDING";
  const isActiveLogin = searchParams.get("status") === "ACTIVE";
  const isWithdrawnState = searchParams.get("STATE") === "WITHDRAWN";
  const isWithdrawnPopup = searchParams.get("withdrawPopup") === "1";
  const isProfilePath = pathname?.startsWith("/profile") ?? false;

  useEffect(() => {
    if (!authInvalidated) return;
    if (isPendingSignup || isActiveLogin) return;
    if (isWithdrawnState) return;
    if (!hasLoggedInFlag()) return;
    try {
      if (window.sessionStorage.getItem("katopia.loginRedirect") === "1") {
        return;
      }
    } catch {
      // ignore storage errors
    }
    if (hasAlertedRef.current) return;
    hasAlertedRef.current = true;
    let message = "인증 정보가 유효하지 않습니다. 다시 로그인해주세요.";
    if (typeof window !== "undefined") {
      try {
        const stored = window.sessionStorage.getItem(
          "katopia.authInvalidMessage",
        );
        if (stored) {
          message = stored;
          window.sessionStorage.removeItem("katopia.authInvalidMessage");
        }
      } catch {
        // ignore storage errors
      }
    }
    alert(message);
  }, [authInvalidated]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.backgroundColor = "#ffffff";
  }, [pathname]);

  useEffect(() => {
    if (!isWithdrawnState) return;
    if (typeof window === "undefined") return;
    if (!isWithdrawnPopup) {
      try {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("withdrawPopup", "1");
        const popup = window.open(nextUrl.toString(), "_blank", "noopener");
        if (popup) {
          popup.focus();
          window.open("", "_self");
          window.close();
        }
      } catch {
        // ignore URL/open errors
      }
      return;
    }
    try {
      if (window.sessionStorage.getItem("katopia.withdrawnAlerted") === "1") {
        return;
      }
      window.sessionStorage.setItem("katopia.withdrawnAlerted", "1");
    } catch {
      // ignore storage errors
    }
    alert("탈퇴한 사용자입니다. 14일 이후에 가입이 가능합니다.");
    window.open("", "_self");
    window.close();
  }, [isWithdrawnState, isWithdrawnPopup]);

  const shouldLock =
    ready &&
    !isAuthenticated &&
    !isPendingSignup &&
    !isActiveLogin &&
    !isWithdrawnState &&
    !LOGIN_GUARD_EXCLUDED_PATHS.includes(pathname ?? "") &&
    (authInvalidated ||
      LOGIN_GUARD_PATHS.includes(pathname ?? "") ||
      isProfilePath);

  return (
    <>
      <div
        className={`mx-auto min-h-screen w-full max-w-97.5 bg-[#ffffff] ${
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
