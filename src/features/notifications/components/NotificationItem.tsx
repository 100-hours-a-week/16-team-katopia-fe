"use client";

import Image from "next/image";
import type { NotificationItem as NotificationItemModel } from "@/src/features/notifications/api/getNotifications";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import { formatDayLabel } from "@/src/features/notifications/utils/formatDayLabel";

type Props = {
  item: NotificationItemModel;
  variant: "unread" | "read";
  onClick: (item: NotificationItemModel) => void;
};

export function NotificationItem({ item, variant, onClick }: Props) {
  const meta = (
    item as {
      meta?: {
        profileImageObjectKeySnapshot?: string | null;
        imageObjectKeySnapshot?: string | null;
      };
    }
  ).meta;
  const imageSrc = resolveMediaUrl(
    item.actor?.profileImageObjectKeySnapshot ??
      meta?.profileImageObjectKeySnapshot ??
      meta?.imageObjectKeySnapshot ??
      null,
  );

  return (
    <li className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9ecf1]">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <Image
            src="/icons/bell.svg"
            alt=""
            width={22}
            height={22}
            className="text-[#8b8f97]"
          />
        )}
      </div>
      <button
        type="button"
        onClick={() => onClick(item)}
        className="flex-1 text-left"
        aria-label="알림 상세 이동"
      >
        <p
          className={
            variant === "unread"
              ? "text-[15px] font-medium text-[#2b2b2b]"
              : "text-[14px] font-medium text-[#2b2b2b]"
          }
        >
          {item.message ?? ""}
        </p>
        <p
          className={
            variant === "unread"
              ? "mt-1 text-[13px] text-[#9aa0a6]"
              : "mt-1 text-[12px] text-[#9aa0a6]"
          }
        >
          {formatDayLabel(item.createdAt)}
        </p>
      </button>
    </li>
  );
}
