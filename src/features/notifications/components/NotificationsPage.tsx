"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import {
  getNotifications,
  type NotificationItem,
} from "@/src/features/notifications/api/getNotifications";
import { patchNotificationRead } from "@/src/features/notifications/api/patchNotificationRead";

const MOCK_NOTIFICATIONS: Array<NotificationItem & { mockImage?: string }> = [
  {
    id: 1,
    type: "FOLLOW",
    message: "사용자닉네임 님이 팔로우하기 시작했습니다.",
    createdAt: "2026-02-16T14:10:00Z",
    readAt: null,
  },
  {
    id: 2,
    type: "POST_LIKE",
    message: "사용자닉네임님이 회원님의 피드를 좋아합니다.",
    createdAt: "2026-02-16T14:10:00Z",
    readAt: null,
    mockImage: "/images/post_ex.webp",
  },
  {
    id: 3,
    type: "VOTE_END",
    message: "“투표 제목”이 종료되었습니다.",
    createdAt: "2026-02-16T14:10:00Z",
    readAt: null,
    mockImage: "/images/post_ex.webp",
  },
];

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    MOCK_NOTIFICATIONS,
  );
  const [loaded, setLoaded] = useState(false);

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
    let cancelled = false;

    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        if (cancelled) return;
        if (data.length) {
          setNotifications(data);
        }
      } catch {
        // keep mock on failure
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    fetchNotifications();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    notifyUnreadCount(unreadCount);
  }, [loaded, notifyUnreadCount, unreadCount]);

  const handleMarkRead = useCallback(
    async (id: number) => {
      const target = notifications.find((item) => item.id === id);
      if (!target || target.readAt) return;

      const nextReadAt = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, readAt: nextReadAt } : item,
        ),
      );

      try {
        await patchNotificationRead(id);
      } catch {
        // ignore patch failures for now
      }
    },
    [notifications],
  );

  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      <header className="relative flex h-14 items-center justify-center px-4">
        <Link
          href="/home"
          aria-label="홈으로 이동"
          className="absolute left-4 flex h-9 w-9 items-center justify-center"
        >
          <Image src="/icons/home.svg" alt="" width={22} height={22} />
        </Link>
        <h1 className="text-[16px] font-semibold text-[#121212]">알림</h1>
      </header>

      <main className="px-4 pb-16 pt-2">
        <ul className="flex flex-col gap-4">
          {notifications.map((item) => {
            const mockImage =
              (item as { mockImage?: string }).mockImage ?? null;
            const profileSrc = resolveMediaUrl(
              item.actor?.profileImageObjectKeySnapshot ?? null,
            );
            const imageSrc = profileSrc ?? mockImage;

            return (
              <li
                key={item.id}
                className="flex items-center gap-4 rounded-2xl bg-white px-4 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
              >
                <button
                  type="button"
                  onClick={() => handleMarkRead(item.id)}
                  className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#d9d9d9]"
                  aria-label="알림 읽음 처리"
                >
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt=""
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src="/icons/user.svg"
                      alt=""
                      width={26}
                      height={26}
                    />
                  )}
                </button>

                <div className="flex-1">
                  <p className="text-[11px] font-medium text-[#121212]">
                    {item.message ?? ""}
                  </p>
                  <p className="mt-1 text-[10px] text-[#c1c1c1]">
                    {formatDate(item.createdAt)}
                  </p>
                </div>

                <Image
                  src="/icons/chevron-right.svg"
                  alt=""
                  width={20}
                  height={20}
                />
              </li>
            );
          })}
        </ul>

        <p className="mt-20 text-center text-[12px] text-[#bdbdbd]">
          알림은 7일 이후 순차적으로 지워집니다.
        </p>
      </main>
    </div>
  );
}
