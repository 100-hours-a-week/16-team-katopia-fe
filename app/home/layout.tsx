import { Suspense } from "react";
import HomePage from "@/src/features/home/components/HomePage";

export default function HomeLayout({
  children,
  feed,
  recommendation,
}: {
  children: React.ReactNode;
  feed: React.ReactNode;
  recommendation: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <HomePage feed={feed} recommendation={recommendation}>
        {children}
      </HomePage>
    </Suspense>
  );
}
