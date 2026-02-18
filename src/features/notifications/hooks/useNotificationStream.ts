import { useEffect, useRef } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import { toast } from "react-toastify";
import { API_BASE_URL } from "@/src/config/api";
import { getAccessToken, issueAccessToken, notifyAuthInvalid } from "@/src/lib/auth";
import type { NotificationItem } from "@/src/features/notifications/api/getNotifications";
import { useNotificationsStore } from "@/src/features/notifications/store/notificationsStore";

type NotificationPayload =
  | NotificationItem
  | NotificationItem[]
  | { data?: NotificationItem | NotificationItem[] };

type Params = {
  enabled?: boolean;
  onNotifications?: (items: NotificationItem[]) => void;
  toastEnabled?: boolean;
  heartbeatTimeoutMs?: number;
  reconnectIntervalMs?: number;
  reconnectMaxIntervalMs?: number;
  seenIdsLimit?: number;
};

const MAX_RETRY = 5;

const isNotificationItem = (value: unknown): value is NotificationItem => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { id?: unknown };
  return typeof candidate.id === "number";
};

const normalizePayload = (payload: NotificationPayload): NotificationItem[] => {
  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: NotificationItem | NotificationItem[] })
      ?.data;
    if (Array.isArray(data)) return data;
    if (isNotificationItem(data)) return [data];
    return [];
  }

  if (Array.isArray(payload)) return payload;
  if (isNotificationItem(payload)) return [payload];
  return [];
};

export function useNotificationStream({
  enabled = true,
  onNotifications,
  toastEnabled = true,
  heartbeatTimeoutMs = 1000 * 60 * 2, // 2분 (20s heartbeat 대비 여유)
  reconnectIntervalMs = 5_000,
  reconnectMaxIntervalMs = 60_000,
  seenIdsLimit = 200,
}: Params) {
  const prependItems = useNotificationsStore((state) => state.prependItems);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const esRef = useRef<EventSource | EventSourcePolyfill | null>(null);
  const closedRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const tokenRefreshTriedRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());
  const authFailedRef = useRef(false);
  const onNotificationsRef = useRef(onNotifications);

  useEffect(() => {
    onNotificationsRef.current = onNotifications;
  }, [onNotifications]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    closedRef.current = false;

    const connect = async () => {
      if (closedRef.current) return;

      // 재시도 횟수 제한
      if (reconnectAttemptRef.current >= MAX_RETRY) {
        console.warn("[notifications:sse] max retry reached. stop reconnect.");
        return;
      }

      // 이미 열려있으면 중복 연결 방지
      if (esRef.current && esRef.current.readyState === EventSource.OPEN) {
        return;
      }

      let token = getAccessToken();
      if (!token) {
        try {
          token = await issueAccessToken();
        } catch (e) {
          console.warn("[notifications:sse] token issue failed", e);
          return; // 🔥 토큰 못 받으면 재연결 중단
        }
      }

      console.log("[notifications:sse] connecting...");
      console.log("[notifications:sse] request headers", {
        Authorization: `Bearer ${token}`,
      });

      const recordActivity = () => {
        lastActivityRef.current = Date.now();
      };

      recordActivity();

      const es = new EventSourcePolyfill(
        `${API_BASE_URL}/api/notifications/stream`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: false,
          heartbeatTimeout: heartbeatTimeoutMs,
        },
      );

      esRef.current = es;

      es.onopen = () => {
        console.log("[notifications:sse] connected");
        reconnectAttemptRef.current = 0;
        tokenRefreshTriedRef.current = false;
        recordActivity();
      };

      const handleMessage = (event: MessageEvent) => {
        const raw = event?.data;
        if (!raw || typeof raw !== "string") return;
        recordActivity();

        try {
          const parsed = JSON.parse(raw) as NotificationPayload;
          const list = normalizePayload(parsed);
          if (!list.length) return;

          const handler =
            onNotificationsRef.current ??
            ((items: NotificationItem[]) => prependItems(items));

          handler(list);

          if (toastEnabled) {
            list.forEach((item) => {
              const id = item?.id;
              if (typeof id === "number" && seenIdsRef.current.has(id)) return;

              if (typeof id === "number") {
                seenIdsRef.current.add(id);
                if (seenIdsRef.current.size > seenIdsLimit) {
                  const first = seenIdsRef.current.values().next().value;
                  if (typeof first === "number") {
                    seenIdsRef.current.delete(first);
                  }
                }
              }

              const message = item?.message?.trim();
              if (!message) return;

              toast(message, {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: true,
                closeButton: false,
                pauseOnHover: true,
                draggable: false,
              });
            });
          }
        } catch {
          console.warn("[notifications:sse] non-JSON message", raw);
        }
      };

      es.onmessage = handleMessage;
      es.addEventListener("notification", handleMessage as EventListener);
      es.addEventListener("ping", () => {
        recordActivity();
      });

      es.onerror = async (event) => {
        const state = es.readyState;
        const status =
          (event as { status?: number } | null)?.status ??
          (event as { target?: { status?: number } } | null)?.target?.status ??
          (es as { xhr?: { status?: number } } | null)?.xhr?.status ??
          null;
        console.warn(`[notifications:sse] error, readyState=${state}`, {
          status,
        });

        if (closedRef.current) return;

        if (status === 401) {
          authFailedRef.current = true;
          es.close();
          notifyAuthInvalid();
          return;
        }

        const inactiveMs = Date.now() - lastActivityRef.current;
        es.close();

        if (inactiveMs < heartbeatTimeoutMs) {
          console.warn("[notifications:sse] recent activity detected, delay reconnect", {
            inactiveMs,
          });
          scheduleReconnect();
          return;
        }

        reconnectAttemptRef.current += 1;

        // 🔥 토큰 재발급은 1번만 시도
        if (!tokenRefreshTriedRef.current) {
          tokenRefreshTriedRef.current = true;
          try {
            await issueAccessToken();
          } catch {
            console.warn("[notifications:sse] token refresh failed");
          }
        }

        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (closedRef.current) return;
      if (authFailedRef.current) return;
      if (reconnectTimerRef.current) return;

      if (reconnectAttemptRef.current >= MAX_RETRY) {
        console.warn("[notifications:sse] too many retries. stop.");
        return;
      }

      const base =
        reconnectIntervalMs * Math.pow(2, reconnectAttemptRef.current - 1);
      const capped = Math.min(base, reconnectMaxIntervalMs);

      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, capped);
    };

    connect();

    return () => {
      closedRef.current = true;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      esRef.current?.close();
      esRef.current = null;
      reconnectAttemptRef.current = 0;
      tokenRefreshTriedRef.current = false;
      authFailedRef.current = false;
    };
  }, [
    enabled,
    toastEnabled,
    prependItems,
    heartbeatTimeoutMs,
    reconnectIntervalMs,
    reconnectMaxIntervalMs,
    seenIdsLimit,
  ]);
}
