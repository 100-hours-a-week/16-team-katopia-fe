import { create } from "zustand";
import type { NotificationItem } from "@/src/features/notifications/api/getNotifications";

type NotificationsState = {
  items: NotificationItem[];
  setItems: (
    next:
      | NotificationItem[]
      | ((prev: NotificationItem[]) => NotificationItem[]),
  ) => void;
  mergeItems: (items: NotificationItem[]) => void;
  prependItems: (items: NotificationItem[]) => void;
  clear: () => void;
};

const dedupe = (items: NotificationItem[]) => {
  const map = new Map<number, NotificationItem>();

  items.forEach((item) => {
    if (!item || typeof item.id !== "number") return;
    const prev = map.get(item.id);
    if (!prev) {
      map.set(item.id, item);
      return;
    }
    map.set(item.id, {
      ...prev,
      ...item,
      // 한 번 읽음 처리된 알림은 병합 중 다시 미읽음으로 돌아가지 않게 고정
      readAt: item.readAt ?? prev.readAt ?? null,
    });
  });

  return Array.from(map.values());
};

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: [],
  setItems: (next) =>
    set((state) => ({
      items: typeof next === "function" ? next(state.items) : next,
    })),
  mergeItems: (items) =>
    set((state) => ({
      items: dedupe([...state.items, ...items]),
    })),
  prependItems: (items) =>
    set((state) => ({
      items: dedupe([...items, ...state.items]),
    })),
  clear: () => set({ items: [] }),
}));
