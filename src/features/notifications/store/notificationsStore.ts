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
  const next: NotificationItem[] = [];
  items.forEach((item) => {
    if (!item || typeof item.id !== "number") return;
    if (map.has(item.id)) return;
    map.set(item.id, item);
    next.push(item);
  });
  return next;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
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
