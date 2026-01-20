"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SplashScreen() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 1️⃣ 살짝 딜레이 후 fade-in
    const fadeTimer = setTimeout(() => {
      setVisible(true);
    }, 100);

    // // 2️⃣ 로고 보여준 뒤 Home으로 이동
    const routeTimer = setTimeout(() => {
      router.replace("/home");
    }, 2200); // 총 노출 시간 (fade-in 1s + 유지)

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(routeTimer);
    };
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Image
        src="/images/logo.png"
        alt="FITCHECK 로고"
        width={180}
        height={48}
        priority
        className={`
          transition-all duration-1000 ease-out
          ${visible ? "opacity-100 scale-140" : "opacity-0 scale-95"}
        `}
      />
    </div>
  );
}
