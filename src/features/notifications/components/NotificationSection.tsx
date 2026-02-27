"use client";

import type { NotificationItem as NotificationItemModel } from "@/src/features/notifications/api/getNotifications";
import { NotificationItem } from "@/src/features/notifications/components/NotificationItem";

type Props = {
  title: string;
  items: NotificationItemModel[];
  variant: "unread" | "read";
  className?: string;
  onItemClick: (item: NotificationItemModel) => void;
};

export function NotificationSection({
  title,
  items,
  variant,
  className,
  onItemClick,
}: Props) {
  if (items.length === 0) return null;

  return (
    <section className={className}>
      <h2 className="text-[14px] font-semibold text-[#2b2b2b]">{title}</h2>
      <ul className={variant === "unread" ? "mt-4 flex flex-col gap-6" : "mt-6 flex flex-col gap-8"}>
        {items.map((item) => (
          <NotificationItem key={item.id} item={item} onClick={onItemClick} />
        ))}
      </ul>
    </section>
  );
}
