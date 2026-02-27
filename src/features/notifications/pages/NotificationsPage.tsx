"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { NotificationItem } from "@/src/features/notifications/api/getNotifications";
import { useInfiniteNotifications } from "@/src/features/notifications/hooks/useInfiniteNotifications";
import { useNotificationNavigation } from "@/src/features/notifications/hooks/useNotificationNavigation";
import { useMarkNotificationsRead } from "@/src/features/notifications/hooks/useMarkNotificationsRead";
import { EmptyNotification } from "@/src/features/notifications/components/EmptyNotification";
import { NotificationSection } from "@/src/features/notifications/components/NotificationSection";

export default function NotificationsPage() {
  const router = useRouter();
  const {
    items: notifications,
    setItems,
    hasMore,
    observe,
    loading,
  } = useInfiniteNotifications({ size: 20, enabled: true });

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications],
  );
  const unreadItems = useMemo(
    () => notifications.filter((item) => !item.readAt),
    [notifications],
  );
  const readItems = useMemo(
    () => notifications.filter((item) => item.readAt),
    [notifications],
  );

  const notifyUnreadCount = useCallback((count: number) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("notifications:unread", { detail: count }),
    );
  }, []);

  useEffect(() => {
    notifyUnreadCount(unreadCount);
  }, [notifyUnreadCount, unreadCount]);

  const { markAsRead } = useMarkNotificationsRead({
    notifications,
    setItems,
  });
  const { handleNavigate } = useNotificationNavigation({
    notifications,
    markAsRead,
  });

  const handleItemClick = useCallback(
    (item: NotificationItem) => {
      handleNavigate(
        item.id,
        item.type ?? null,
        item.referenceId ?? null,
        item.actor?.id ?? null,
      );
    },
    [handleNavigate],
  );

  return (
    <div className="min-h-screen bg-white">
      <header className="flex h-14 items-center px-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="-ml-1 flex h-9 w-9 items-center justify-center"
        >
          <Image src="/icons/back.svg" alt="" width={22} height={22} />
        </button>
      </header>

      <main className="px-6 pb-16">
        {notifications.length === 0 && !loading ? (
          <EmptyNotification />
        ) : (
          <>
            <h1 className="mt-7 text-[26px] font-semibold text-[#1c1c1c]">
              알림
            </h1>

            <NotificationSection
              title="새로운 알림"
              items={unreadItems}
              variant="unread"
              className="mt-6"
              onItemClick={handleItemClick}
            />

            <NotificationSection
              title="지난 알림"
              items={readItems}
              variant="read"
              className="mt-10"
              onItemClick={handleItemClick}
            />

            {hasMore && (
              <div ref={observe} className="h-16 w-full" aria-hidden />
            )}

            <p className="mt-20 text-center text-[12px] text-[#bdbdbd]">
              알림은 7일 이후 순차적으로 지워집니다.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
