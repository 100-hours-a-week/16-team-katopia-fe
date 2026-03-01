import { useCallback, useRef } from "react";
import type { NotificationItem } from "@/src/features/notifications/api/getNotifications";
import { patchNotificationRead } from "@/src/features/notifications/api/patchNotificationRead";

type SetNotificationItems = (
  updater: (prev: NotificationItem[]) => NotificationItem[],
) => void;

type Params = {
  notifications: NotificationItem[];
  setItems: SetNotificationItems;
};

export function useMarkNotificationsRead({ notifications, setItems }: Params) {
  const markedIdsRef = useRef<Set<number>>(new Set());
  const pendingReadIdsRef = useRef<Set<number>>(new Set());

  const markAllAsRead = useCallback(() => {
    const unreadIds = notifications
      .filter((item) => !item.readAt && !markedIdsRef.current.has(item.id))
      .map((item) => item.id);
    if (unreadIds.length === 0) return;

    unreadIds.forEach((id) => {
      markedIdsRef.current.add(id);
      pendingReadIdsRef.current.add(id);
    });
  }, [notifications]);

  const markAsRead = useCallback(
    (id: number) => {
      const target = notifications.find((item) => item.id === id);
      if (!target || target.readAt) return;
      markedIdsRef.current.add(id);
      pendingReadIdsRef.current.add(id);
    },
    [notifications],
  );

  const commitMarkedAsRead = useCallback(() => {
    if (pendingReadIdsRef.current.size === 0) return;
    const pendingReadIdSet = new Set(pendingReadIdsRef.current);
    const nextReadAt = new Date().toISOString();

    setItems((prev) =>
      prev.map((item) =>
        pendingReadIdSet.has(item.id) ? { ...item, readAt: nextReadAt } : item,
      ),
    );

    pendingReadIdSet.forEach((id) => {
      patchNotificationRead(id).catch(() => {
        // ignore patch failures for now
      });
    });

    pendingReadIdsRef.current.clear();
  }, [setItems]);

  const isPendingRead = useCallback((id: number) => {
    return pendingReadIdsRef.current.has(id);
  }, []);

  return { markAsRead, markAllAsRead, commitMarkedAsRead, isPendingRead };
}
