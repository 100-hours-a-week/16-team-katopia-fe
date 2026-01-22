"use client";

import { useEffect, useState } from "react";
import { issueAccessToken } from "@/src/lib/auth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        await issueAccessToken(); // RT → AT
      } catch {
        // 로그인 안 된 상태
      } finally {
        setReady(true);
      }
    };

    bootstrapAuth();
  }, []);

  if (!ready) return null; // or Skeleton

  return <>{children}</>;
}
