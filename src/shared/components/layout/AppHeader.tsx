"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { useNotificationsStore } from "@/src/features/notifications/store/notificationsStore";

interface AppHeaderProps {
  logoSrc?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export default function AppHeader({
  logoSrc = "/images/logo.png",
  alt = "FITCHECK",
  width = 96,
  height = 24,
}: AppHeaderProps) {
  const { ready, isAuthenticated } = useAuth();
  const items = useNotificationsStore((state) => state.items);
  const unreadCount = useMemo(() => {
    if (!ready || !isAuthenticated) return 0;
    return items.reduce((count, item) => (item.readAt ? count : count + 1), 0);
  }, [items, ready, isAuthenticated]);

  return (
    <header className="absolute left-0 top-0 flex h-14 w-full items-center justify-between px-1">
      <Image src={logoSrc} alt={alt} width={width} height={height} />

      <div className="flex items-center gap-1">
        <Link
          href="/notifications"
          aria-label="알림"
          className="relative flex h-9 w-9 items-center justify-center"
        >
          <Image src="/icons/bell.svg" alt="" width={23} height={23} />
          {unreadCount > 0 && (
            <span className="absolute right-0 top-0 min-w-5 translate-x-1/4 -translate-y-1/4 rounded-full bg-[#121212] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
        <button
          type="button"
          aria-label="메시지"
          className="flex h-9 w-9 items-center justify-center"
        >
          <Image src="/icons/home_send.svg" alt="" width={23} height={23} />
        </button>
      </div>
    </header>
  );
}
