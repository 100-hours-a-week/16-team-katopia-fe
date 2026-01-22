// app/layout.tsx
import "./globals.css";
import LayoutShell from "@/src/shared/components/layout/LayoutShell";
import AuthProvider from "@/src/features/auth/providers/AuthProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-[#f0f0f0] min-h-screen">
        {/* 🔥 전역 인증 부트스트랩 */}
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
