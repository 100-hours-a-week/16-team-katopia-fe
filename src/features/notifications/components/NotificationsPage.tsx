"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import { patchNotificationRead } from "@/src/features/notifications/api/patchNotificationRead";
import { useInfiniteNotifications } from "@/src/features/notifications/hooks/useInfiniteNotifications";

const formatDayLabel = (value?: string | null) => {
  if (!value) return "";
  const hasZone = /Z$/i.test(value) || /[+-]\d{2}:\d{2}$/.test(value);
  const normalized = hasZone ? value : `${value}+09:00`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  if (dayKey(date) === dayKey(now)) return "오늘";

  const formatter = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const parts = formatter.formatToParts(date);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}. ${part("month")}. ${part("day")}`;
};

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
  const markedAllRef = useRef(false);

  const notifyUnreadCount = useCallback((count: number) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("notifications:unread", { detail: count }),
    );
  }, []);

  useEffect(() => {
    notifyUnreadCount(unreadCount);
  }, [notifyUnreadCount, unreadCount]);

  useEffect(() => {
    if (markedAllRef.current) return;
    if (notifications.length === 0) return;
    const unreadIds = notifications
      .filter((item) => !item.readAt)
      .map((item) => item.id);
    if (unreadIds.length === 0) return;
    markedAllRef.current = true;

    const nextReadAt = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        unreadIds.includes(item.id) ? { ...item, readAt: nextReadAt } : item,
      ),
    );

    unreadIds.forEach((id) => {
      patchNotificationRead(id).catch(() => {
        // ignore patch failures for now
      });
    });
  }, [notifications, setItems]);

  const handleNavigate = useCallback(
    (
      id: number,
      type?: string | null,
      referenceId?: number | null,
      actorId?: number | null,
    ) => {
      const target = notifications.find((item) => item.id === id);
      if (!target) return;

      const meta = (target as { meta?: Record<string, unknown> } | null)?.meta;
      const resolvedType = target.type ?? type ?? null;
      const resolvedReferenceId =
        target.referenceId ??
        (target as { refId?: unknown } | null)?.refId ??
        (meta as { referenceId?: unknown } | null)?.referenceId ??
        (meta as { refId?: unknown } | null)?.refId ??
        (meta as { postId?: unknown } | null)?.postId ??
        (meta as { voteId?: unknown } | null)?.voteId ??
        referenceId ??
        null;
      const resolvedActorId =
        target.actor?.id ??
        (target as { actorId?: unknown } | null)?.actorId ??
        (meta as { actorId?: unknown } | null)?.actorId ??
        (meta as { memberId?: unknown } | null)?.memberId ??
        (meta as { userId?: unknown } | null)?.userId ??
        (meta as { followerId?: unknown } | null)?.followerId ??
        (meta as { id?: unknown } | null)?.id ??
        actorId ??
        null;

      if (!target.readAt) {
        const nextReadAt = new Date().toISOString();
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, readAt: nextReadAt } : item,
          ),
        );

        patchNotificationRead(id).catch(() => {
          // ignore patch failures for now
        });
      }

      if (resolvedType === "FOLLOW" && resolvedActorId != null) {
        console.log("[notifications] route", "profile", resolvedActorId);
        router.push(`/profile/${resolvedActorId}`);
        return;
      }
      if (resolvedType === "POST_LIKE" || resolvedType === "POST_COMMENT") {
        if (resolvedReferenceId != null) {
          console.log("[notifications] route", "post", resolvedReferenceId);
          router.push(`/post/${resolvedReferenceId}`);
        }
        return;
      }
      if (resolvedType === "VOTE_CLOSED") {
        if (resolvedReferenceId != null) {
          console.log("[notifications] route", "vote", resolvedReferenceId);
          router.push(`/vote/${resolvedReferenceId}`);
        }
      }
    },
    [notifications, router, setItems],
  );

  const unreadItems = useMemo(
    () => notifications.filter((item) => !item.readAt),
    [notifications],
  );
  const readItems = useMemo(
    () => notifications.filter((item) => item.readAt),
    [notifications],
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
          <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 py-10 text-center">
            <Image
              src="/icons/circle-alert.svg"
              alt=""
              width={80}
              height={80}
              className="opacity-40"
            />
            <p className="text-[14px] font-medium text-[#6f6f6f]">
              알림 메시지가 없습니다.
            </p>
            <p className="text-[13px] text-[#bdbdbd]">
              최근 7일 간의 알림을 확인하실 수 있습니다.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mt-7 text-[26px] font-semibold text-[#1c1c1c]">
              알림
            </h1>

            {unreadItems.length > 0 && (
              <section className="mt-6">
                <h2 className="text-[14px] font-semibold text-[#2b2b2b]">
                  새로운 알림
                </h2>
                <ul className="mt-4 flex flex-col gap-6">
                  {unreadItems.map((item) => {
                    const meta = (
                      item as {
                        meta?: {
                          profileImageObjectKeySnapshot?: string | null;
                          imageObjectKeySnapshot?: string | null;
                        };
                      }
                    ).meta;
                    const profileSrc = resolveMediaUrl(
                      item.actor?.profileImageObjectKeySnapshot ??
                        meta?.profileImageObjectKeySnapshot ??
                        meta?.imageObjectKeySnapshot ??
                        null,
                    );
                    const imageSrc = profileSrc ?? null;

                    return (
                      <li key={item.id} className="flex items-start gap-4">
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
                          onClick={() =>
                            handleNavigate(
                              item.id,
                              item.type ?? null,
                              item.referenceId ?? null,
                              item.actor?.id ?? null,
                            )
                          }
                          className="flex-1 text-left"
                          aria-label="알림 상세 이동"
                        >
                          <p className="text-[15px] font-medium text-[#2b2b2b]">
                            {item.message ?? ""}
                          </p>
                          <p className="mt-1 text-[13px] text-[#9aa0a6]">
                            {formatDayLabel(item.createdAt)}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {readItems.length > 0 && (
              <section className="mt-10">
                <h2 className="text-[14px] font-semibold text-[#2b2b2b]">
                  지난 알림
                </h2>
                <ul className="mt-6 flex flex-col gap-8">
                  {readItems.map((item) => {
                    const meta = (
                      item as {
                        meta?: {
                          profileImageObjectKeySnapshot?: string | null;
                          imageObjectKeySnapshot?: string | null;
                        };
                      }
                    ).meta;
                    const profileSrc = resolveMediaUrl(
                      meta?.imageObjectKeySnapshot ?? null,
                    );
                    const imageSrc = profileSrc ?? null;

                    return (
                      <li key={item.id} className="flex items-start gap-4">
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
                          onClick={() =>
                            handleNavigate(
                              item.id,
                              item.type ?? null,
                              item.referenceId ?? null,
                              item.actor?.id ?? null,
                            )
                          }
                          className="flex-1 text-left"
                          aria-label="알림 상세 이동"
                        >
                          <p className="text-[14px] font-medium text-[#2b2b2b]">
                            {item.message ?? ""}
                          </p>
                          <p className="mt-1 text-[12px] text-[#9aa0a6]">
                            {formatDayLabel(item.createdAt)}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
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
