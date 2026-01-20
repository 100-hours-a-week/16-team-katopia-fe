"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
    icon: "/icons/vote.svg",
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

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[390px] -translate-x-1/2 border-t bg-white">
      <ul className="relative flex h-16 items-center justify-between px-6">
        {NAV_ITEMS.map((item, idx) => {
          const isActive = pathname === item.href;

          // 중앙 FAB
          if (item.label === "작성") {
            return (
              <li
                key={idx}
                className="relative -mt-8 flex flex-col items-center gap-1"
              >
                <Link
                  href={item.href}
                  className="flex h-14 w-14 items-center justify-center rounded-full border bg-white shadow"
                >
                  <Image
                    src={item.icon!}
                    alt={item.label}
                    width={28}
                    height={28}
                  />
                </Link>
                {isActive && <span className="h-1 w-1 rounded-full bg-black" />}
              </li>
            );
          }

          return (
            <li key={idx}>
              <Link
                href={item.href}
                className="flex flex-col items-center gap-1"
              >
                <Image
                  src={item.icon!}
                  alt={item.label}
                  width={22}
                  height={22}
                  className={cn("opacity-60", isActive && "opacity-100")}
                />
                {isActive && <span className="h-1 w-1 rounded-full bg-black" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
