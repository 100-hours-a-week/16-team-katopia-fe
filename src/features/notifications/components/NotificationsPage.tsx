"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import { patchNotificationRead } from "@/src/features/notifications/api/patchNotificationRead";
import { useInfiniteNotifications } from "@/src/features/notifications/hooks/useInfiniteNotifications";

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

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <header className="relative flex h-14 items-center justify-center px-4">
        <Link
          href="/home"
          aria-label="홈으로 이동"
          className="absolute left-4 flex h-9 w-9 items-center justify-center"
        >
          <Image src="/icons/home.svg" alt="" width={22} height={22} />
        </Link>
        <h1 className="text-[13px] font-semibold text-[#121212]">알림</h1>
      </header>

      <main className="px-4 pb-16 pt-2">
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
            <ul className="flex flex-col gap-4">
              {notifications.map((item) => {
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
                const isFollow = item.type === "FOLLOW";

                return (
                  <li
                    key={item.id}
                    className="relative flex items-center gap-4 rounded-2xl bg-white px-4 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                  >
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
                      className="flex w-full items-center gap-4 text-left"
                      aria-label="알림 상세 이동"
                    >
                      <div
                        className={`flex items-center justify-center overflow-hidden bg-[#d9d9d9] ${
                          isFollow ? "h-12 w-12 rounded-full" : "h-14 w-12 rounded-sm"
                        }`}
                      >
                        {imageSrc ? (
                          <Image
                            src={imageSrc}
                            alt=""
                            width={48}
                            height={48}
                            className={`h-full w-full object-cover ${
                              isFollow ? "rounded-full" : "rounded-sm"
                            }`}
                          />
                        ) : (
                          <Image
                            src="/icons/user.svg"
                            alt=""
                            width={26}
                            height={26}
                          />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          {!item.readAt && (
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black" />
                          )}
                          <div className="flex-1">
                            <p className="text-[11px] font-medium text-[#121212]">
                              {item.message ?? ""}
                            </p>
                            <p className="mt-1 text-[10px] text-[#c1c1c1]">
                              {formatDate(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Image
                        src="/icons/chevron-right.svg"
                        alt=""
                        width={20}
                        height={20}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
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
