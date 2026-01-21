// app/layout.tsx
import "./globals.css";
import LayoutShell from "@/src/shared/components/layout/LayoutShell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-neutral-700 min-h-screen">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
