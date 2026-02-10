"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SplashScreen() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setVisible(true);
    }, 200);

    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 2000);

    const routeTimer = setTimeout(() => {
      router.replace("/home");
    }, 2300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(exitTimer);
      clearTimeout(routeTimer);
    };
  }, [router]);

  return (
    <div
      className={[
        "relative flex h-screen items-center justify-center overflow-hidden bg-black text-white transition-opacity duration-300 ease-out",
        exiting ? "opacity-0" : "opacity-100",
      ].join(" ")}
    >
      <div className="flex h-full w-full max-w-[420px] flex-col justify-center px-8 py-16">
        {/* 문구 */}
        <div className="space-y-6">
          <div className="mt-10 space-y-1 text-[28px] font-light leading-tight tracking-[-0.02em]">
            {["모든", "순간의"].map((text, index) => (
              <p
                key={text}
                className={[
                  "transition-all duration-700 ease-out",
                  visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2",
                ].join(" ")}
                style={{ transitionDelay: `${index * 160}ms` }}
              >
                {text}
              </p>
            ))}
          </div>

          <div
            className={[
              "h-px w-full bg-white/80 transition-all duration-700 ease-out",
              visible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0",
            ].join(" ")}
            style={{ transitionDelay: "360ms" }}
          />

          <div className="space-y-1 text-[28px] font-light leading-tight tracking-[-0.02em]">
            {["스타일을", "담다"].map((text, index) => (
              <p
                key={text}
                className={[
                  "transition-all duration-700 ease-out",
                  visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2",
                ].join(" ")}
                style={{ transitionDelay: `${(index + 3) * 160}ms` }}
              >
                {text}
              </p>
            ))}
          </div>
        </div>

        {/* 로고 */}
        <div className="mt-14">
          <Image
            src="/icons/white_logo.png"
            alt="FITCHECK 로고"
            width={150}
            height={34}
            priority
            className={[
              "-ml-3 transition-all duration-800 ease-out",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
            ].join(" ")}
            style={{ transitionDelay: "900ms" }}
          />
        </div>

        {/* 프로그레스 바 */}
        <div className="mt-10 h-[6px] w-full rounded-full bg-white/20">
          <div
            className={[
              "h-full rounded-full bg-white transition-all duration-[2600ms] ease-out",
              visible ? "w-full" : "w-0",
            ].join(" ")}
          />
        </div>
      </div>
    </div>
  );
}
