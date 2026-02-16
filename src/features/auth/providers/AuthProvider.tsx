"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/src/config/api";
import { usePathname, useSearchParams } from "next/navigation";
import {
  authFetch,
  issueAccessToken,
  isLoggedOutFlag,
  isAuthInvalidated,
} from "@/src/lib/auth";

type AuthContextValue = {
  isAuthenticated: boolean;
  ready: boolean;
  setAuthenticated: (value: boolean) => void;
  authInvalidated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [authInvalidated, setAuthInvalidated] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPendingSignup =
    searchParams.get("status") === "PENDING" ||
    (pathname?.startsWith("/signup") ?? false);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        if (isPendingSignup) {
          setAuthenticated(false);
          setAuthInvalidated(false);
          return;
        }
        if (isLoggedOutFlag()) {
          setAuthenticated(false);
          setAuthInvalidated(false);
          return;
        }
        if (isAuthInvalidated()) {
          setAuthenticated(false);
          setAuthInvalidated(true);
          return;
        }
        await issueAccessToken(); // RT → AT

        // 토큰 발급이 되더라도 실제 로그인 상태인지 한 번 더 확인합니다.
        const meRes = await authFetch(`${API_BASE_URL}/api/members/me`, {
          method: "GET",
          cache: "no-store",
          skipAuthRefresh: true,
        });

        setAuthenticated(meRes.ok);
      } catch {
        setAuthenticated(false);
      } finally {
        setReady(true);
      }
    };

    bootstrapAuth();
  }, [isPendingSignup]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleInvalid = () => {
      setAuthenticated(false);
      setAuthInvalidated(true);
    };
    window.addEventListener("auth:invalid", handleInvalid);
    return () => window.removeEventListener("auth:invalid", handleInvalid);
  }, []);

  // ✅ Hook은 return 위에서 항상 호출
  const value = useMemo(
    () => ({ isAuthenticated, ready, setAuthenticated, authInvalidated }),
    [isAuthenticated, ready, authInvalidated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
