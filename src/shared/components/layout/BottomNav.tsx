"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import CreateBottomSheet from "./CreateBottomSheet";

const NAV_ITEMS = [
  {
    href: "/home",
    icon: "/icons/home.svg",
    label: "홈",
  },
  {
    href: "/search",
    icon: "/icons/search.svg",
    label: "검색",
  },
  {
    href: "/post",
    icon: "/icons/plus.svg", // 중앙 +
    label: "작성",
  },
  {
    href: "/vote",
    icon: "/icons/votee.svg",
    label: "투표",
  },
  {
    href: "/profile",
    icon: "/icons/profile.svg",
    label: "프로필",
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-97.5 -translate-x-1/2 border-t bg-white/60 backdrop-blur-sm">
        <ul className="relative flex h-16 items-center justify-between px-6">
          {NAV_ITEMS.map((item, idx) => {
            const isActive = pathname === item.href;

            // 중앙 FAB
            if (item.label === "작성") {
              const iconSizeClass = "h-6 w-6";
              return (
                <li
                  key={idx}
                  className="relative flex flex-col items-center gap-1"
                >
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="flex flex-col items-center gap-1"
                  >
                    <Image
                      src={item.icon!}
                      alt={item.label}
                      width={20}
                      height={20}
                      loading="eager"
                      className={cn(
                        "opacity-60",
                        iconSizeClass,
                        isActive && "opacity-100",
                      )}
                    />
                  </button>
                  <span className="text-[11px] text-neutral-600">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="h-1 w-1 rounded-full bg-black" />
                  )}
                </li>
              );
            }

            const isProfile = item.label === "프로필";
            const iconSizeClass = isProfile ? "h-5 w-5" : "h-6 w-6";

            return (
              <li key={idx}>
                <Link
                  href={item.href}
                  className="flex flex-col items-center gap-1"
                >
                  <Image
                    src={item.icon!}
                    alt={item.label}
                    width={20}
                    height={20}
                    className={cn(
                      "opacity-60",
                      iconSizeClass,
                      isActive && "opacity-100",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[11px] text-neutral-500",
                      isActive && "text-neutral-900",
                    )}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="h-1 w-1 rounded-full bg-black" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <CreateBottomSheet open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
