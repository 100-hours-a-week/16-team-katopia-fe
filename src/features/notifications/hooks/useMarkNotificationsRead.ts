import { useCallback, useEffect, useRef } from "react";
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

  useEffect(() => {
    if (notifications.length === 0) return;

    const unreadIds = notifications
      .filter((item) => !item.readAt && !markedIdsRef.current.has(item.id))
      .map((item) => item.id);
    if (unreadIds.length === 0) return;

    unreadIds.forEach((id) => markedIdsRef.current.add(id));
    const unreadIdSet = new Set(unreadIds);
    const nextReadAt = new Date().toISOString();

    setItems((prev) =>
      prev.map((item) =>
        unreadIdSet.has(item.id) ? { ...item, readAt: nextReadAt } : item,
      ),
    );

    unreadIds.forEach((id) => {
      patchNotificationRead(id).catch(() => {
        // ignore patch failures for now
      });
    });
  }, [notifications, setItems]);

  const markAsRead = useCallback(
    (id: number) => {
      const target = notifications.find((item) => item.id === id);
      if (!target || target.readAt) return;
      markedIdsRef.current.add(id);

      const nextReadAt = new Date().toISOString();
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, readAt: nextReadAt } : item,
        ),
      );

      patchNotificationRead(id).catch(() => {
        // ignore patch failures for now
      });
    },
    [notifications, setItems],
  );

  return { markAsRead };
}
