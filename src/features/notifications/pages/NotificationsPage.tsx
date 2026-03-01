"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { NotificationItem } from "@/src/features/notifications/api/getNotifications";
import { useInfiniteNotifications } from "@/src/features/notifications/hooks/useInfiniteNotifications";
import { useNotificationNavigation } from "@/src/features/notifications/hooks/useNotificationNavigation";
import { useMarkNotificationsRead } from "@/src/features/notifications/hooks/useMarkNotificationsRead";
import { EmptyNotification } from "@/src/features/notifications/components/EmptyNotification";
import { NotificationItem as NotificationListItem } from "@/src/features/notifications/components/NotificationItem";

export default function NotificationsPage() {
  const router = useRouter();
  const {
    items: notifications,
    setItems,
    hasMore,
    observe,
    loading,
  } = useInfiniteNotifications({ size: 20, enabled: true });
  const [initialUnreadIdSet] = useState<Set<number>>(
    () =>
      new Set(
        notifications.filter((item) => !item.readAt).map((item) => item.id),
      ),
  );

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
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

  const { markAsRead, markAllAsRead, commitMarkedAsRead, isPendingRead } =
    useMarkNotificationsRead({
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

  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  useEffect(() => {
    return () => {
      commitMarkedAsRead();
    };
  }, [commitMarkedAsRead]);

  return (
    <div className="min-h-screen bg-white">
      <header className="flex h-14 items-center px-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="뒤로 가기"
          className="-ml-1 flex h-9 w-9 items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/back.svg" alt="" width={22} height={22} />
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
            <ul className="mt-6 flex flex-col gap-7">
              {notifications.map((item) => (
                <NotificationListItem
                  key={item.id}
                  item={item}
                  isNew={
                    initialUnreadIdSet.has(item.id) ||
                    !item.readAt ||
                    isPendingRead(item.id)
                  }
                  onClick={handleItemClick}
                />
              ))}
            </ul>

            {hasMore && <div ref={observe} className="h-16 w-full" aria-hidden />}

            <p className="mt-20 text-center text-[12px] text-[#bdbdbd]">
              알림은 7일 이후 순차적으로 지워집니다.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
