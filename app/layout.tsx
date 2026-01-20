// app/layout.tsx
import "./globals.css";
import BottomNav from "@/src/shared/components/layout/BottomNav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-neutral-700 min-h-screen">
        <div className="mx-auto min-h-screen w-full max-w-[390px] bg-white">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
