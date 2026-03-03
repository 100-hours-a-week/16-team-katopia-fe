// app/layout.tsx
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import type { Metadata } from "next";
import LayoutShell from "@/src/shared/components/layout/LayoutShell";
import AuthProvider from "@/src/features/auth/providers/AuthProvider";
import ReactQueryProvider from "@/src/features/auth/providers/ReactQueryProvider";
import GA4PageTracker from "@/src/shared/analytics/GA4PageTracker";
import { Suspense } from "react";
import { Noto_Sans_KR } from "next/font/google";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

const notoSansKr = Noto_Sans_KR({
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FITCHECK",
    template: "%s | FITCHECK",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId =
    process.env.NEXT_PUBLIC_GA_ID ??
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ??
    "G-ZJE89QY15L";
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-M86VXLL2";

  return (
    <html lang="ko">
      <body
        className={`${notoSansKr.variable} min-h-screen bg-[#ffffff] text-[#121212]`}
      >
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
        {gaId ? (
          <Suspense fallback={null}>
            <GA4PageTracker gaId={gaId} />
          </Suspense>
        ) : null}
        {!gaId && gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
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
