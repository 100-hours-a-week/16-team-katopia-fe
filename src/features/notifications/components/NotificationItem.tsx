"use client";

import type { NotificationItem as NotificationItemModel } from "@/src/features/notifications/api/getNotifications";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import { formatDayLabel } from "@/src/features/notifications/utils/formatDayLabel";

type Props = {
  item: NotificationItemModel;
  onClick: (item: NotificationItemModel) => void;
  isNew?: boolean;
};

export function NotificationItem({ item, onClick, isNew = false }: Props) {
  const meta = (
    item as {
      meta?: {
        imageObjectKeySnapshot?: string | null;
      };
    }
  ).meta;
  const isFollowType = item.type === "FOLLOW";
  const imageSrc = resolveMediaUrl(meta?.imageObjectKeySnapshot ?? null);

  return (
    <li className="flex items-start gap-4">
      <div
        className={
          isFollowType
            ? "relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-[#e9ecf1]"
            : "relative h-13 w-11 shrink-0 overflow-hidden rounded-[2px] bg-[#e9ecf1]"
        }
      >
        {imageSrc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              width={48}
              height={48}
              className={
                isFollowType
                  ? "h-full w-full object-cover"
                  : "h-full w-full object-cover"
              }
              loading="lazy"
            />
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/bell.svg"
              alt=""
              width={22}
              height={22}
              className="text-[#8b8f97]"
              loading="lazy"
            />
          </>
        )}
      </div>
      <button
        type="button"
        onClick={() => onClick(item)}
        className="flex-1 text-left"
        aria-label="알림 상세 이동"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-medium text-[#2b2b2b]">
            {item.message ?? ""}
          </p>
          {isNew && (
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-black"
              aria-hidden
            />
          )}
        </div>
        <p className="mt-1 text-[12px] text-[#9aa0a6]">
          {formatDayLabel(item.createdAt)}
        </p>
      </button>
    </li>
  );
}
