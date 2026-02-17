"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";
import { getNotifications } from "@/src/features/notifications/api/getNotifications";

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
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!ready || !isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const fetchUnreadCount = async () => {
      try {
        const data = await getNotifications({ size: 100 });
        if (cancelled) return;
        const count = (data.notifications ?? []).filter(
          (item) => !item.readAt,
        ).length;
        setUnreadCount(count);
      } catch {
        if (!cancelled) setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, ready]);

  useEffect(() => {
    const handleUnread = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail;
      if (typeof detail === "number") setUnreadCount(detail);
    };
    if (typeof window === "undefined") return;
    window.addEventListener("notifications:unread", handleUnread);
    return () =>
      window.removeEventListener("notifications:unread", handleUnread);
  }, []);

  return (
    <header className="absolute left-0 top-0 flex h-14 w-full items-center justify-between px-4">
      <Image src={logoSrc} alt={alt} width={width} height={height} priority />

      <div className="flex items-center gap-1">
        <Link
          href="/notifications"
          aria-label="알림"
          className="relative flex h-9 w-9 items-center justify-center"
        >
          <Image src="/icons/bell.svg" alt="" width={20} height={20} />
          {unreadCount > 0 && (
            <span className="absolute right-0 top-0 min-w-5 translate-x-1/4 -translate-y-1/4 rounded-full bg-[#ff58c3] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
              {unreadCount > 999 ? "999+" : unreadCount}
            </span>
          )}
        </Link>
        <button
          type="button"
          aria-label="메시지"
          className="flex h-9 w-9 items-center justify-center"
        >
          <Image src="/icons/home_send.svg" alt="" width={20} height={20} />
        </button>
      </div>
    </header>
  );
}
