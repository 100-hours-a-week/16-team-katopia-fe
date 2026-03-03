"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/src/config/api";
import { usePathname, useSearchParams } from "next/navigation";
import {
  authFetch,
  issueAccessToken,
  isLoggedOutFlag,
  isAuthInvalidated,
  getAccessToken,
  isAccessTokenExpired,
} from "@/src/lib/auth";

type AuthContextValue = {
  isAuthenticated: boolean;
  ready: boolean;
  setAuthenticated: (value: boolean) => void;
  authInvalidated: boolean;
  currentMember: {
    id?: number | string;
    nickname?: string;
    profileImageUrl?: string | null;
  } | null;
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
  const [currentMember, setCurrentMember] = useState<{
    id?: number | string;
    nickname?: string;
    profileImageUrl?: string | null;
  } | null>(null);
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
          setCurrentMember(null);
          return;
        }
        if (isLoggedOutFlag()) {
          setAuthenticated(false);
          setAuthInvalidated(false);
          setCurrentMember(null);
          return;
        }
        if (isAuthInvalidated()) {
          setAuthenticated(false);
          setAuthInvalidated(true);
          setCurrentMember(null);
          return;
        }
        const existing = getAccessToken();
        if (!existing || isAccessTokenExpired(existing)) {
          await issueAccessToken(); // RT → AT
        }

        // 토큰 발급이 되더라도 실제 로그인 상태인지 한 번 더 확인합니다.
        const meRes = await authFetch(`${API_BASE_URL}/api/members/me`, {
          method: "GET",
          cache: "no-store",
          skipAuthRefresh: true,
        });

        setAuthenticated(meRes.ok);
        if (meRes.ok) {
          const meJson = (await meRes.json().catch(() => null)) as
            | {
                data?: {
                  id?: number | string;
                  profile?: {
                    memberId?: number | string;
                    id?: number | string;
                    nickname?: string;
                    profileImageObjectKey?: string | null;
                    profileImageUrl?: string | null;
                  };
                };
              }
            | null;
          const profile = meJson?.data?.profile ?? {};
          const memberId =
            meJson?.data?.id ?? profile.memberId ?? profile.id ?? undefined;
          setCurrentMember({
            id: memberId,
            nickname: profile.nickname,
            profileImageUrl:
              profile.profileImageObjectKey ?? profile.profileImageUrl ?? null,
          });
        } else {
          setCurrentMember(null);
        }
      } catch {
        setAuthenticated(false);
        setCurrentMember(null);
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
      setCurrentMember(null);
    };
    window.addEventListener("auth:invalid", handleInvalid);
    return () => window.removeEventListener("auth:invalid", handleInvalid);
  }, []);

  // ✅ Hook은 return 위에서 항상 호출
  const value = useMemo(
    () => ({
      isAuthenticated,
      ready,
      setAuthenticated,
      authInvalidated,
      currentMember,
    }),
    [isAuthenticated, ready, authInvalidated, currentMember],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
