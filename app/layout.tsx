// app/layout.tsx
import "./globals.css";
import LayoutShell from "@/src/shared/components/layout/LayoutShell";
import AuthProvider from "@/src/features/auth/providers/AuthProvider";
import ReactQueryProvider from "@/src/features/auth/providers/ReactQueryProvider";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        className="min-h-screen bg-[#ffffff] text-[#121212]"
        style={{ color: "#121212", backgroundColor: "#f0f0f0" }}
      >
        {/* 🔥 전역 인증 부트스트랩 */}
        <ReactQueryProvider>
          <Suspense fallback={null}>
            <AuthProvider>
              <LayoutShell>{children}</LayoutShell>
            </AuthProvider>
          </Suspense>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
