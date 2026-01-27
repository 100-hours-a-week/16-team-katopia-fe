"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { issueAccessToken } from "@/src/lib/auth";

type AuthContextValue = {
  isAuthenticated: boolean;
  ready: boolean;
  setAuthenticated: (value: boolean) => void;
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

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        await issueAccessToken(); // RT → AT
        setAuthenticated(true);
      } catch {
        setAuthenticated(false);
      } finally {
        setReady(true);
      }
    };

    bootstrapAuth();
  }, []);

  // ✅ Hook은 return 위에서 항상 호출
  const value = useMemo(
    () => ({ isAuthenticated, ready, setAuthenticated }),
    [isAuthenticated, ready],
  );

  // ✅ return은 Hook 이후에만
  if (!ready) return null; // or Skeleton

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
