// app/layout.tsx
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import LayoutShell from "@/src/shared/components/layout/LayoutShell";
import AuthProvider from "@/src/features/auth/providers/AuthProvider";
import ReactQueryProvider from "@/src/features/auth/providers/ReactQueryProvider";
import { Suspense } from "react";
import { Noto_Sans_KR } from "next/font/google";

const notoSansKr = Noto_Sans_KR({
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKr.variable} min-h-screen bg-[#ffffff] text-[#121212]`}
        style={{ color: "#121212", backgroundColor: "#f0f0f0" }}
      >
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
