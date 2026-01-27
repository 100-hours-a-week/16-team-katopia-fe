// app/layout.tsx
import "./globals.css";
import LayoutShell from "@/src/shared/components/layout/LayoutShell";
import AuthProvider from "@/src/features/auth/providers/AuthProvider";
import ReactQueryProvider from "@/src/features/auth/providers/ReactQueryProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        className="min-h-screen bg-[#f0f0f0] text-[#121212]"
        style={{ color: "#121212", backgroundColor: "#f0f0f0" }}
      >
        {/* 🔥 전역 인증 부트스트랩 */}
        <ReactQueryProvider>
          <AuthProvider>
            <LayoutShell>{children}</LayoutShell>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
