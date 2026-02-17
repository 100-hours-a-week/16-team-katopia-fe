import { useEffect, useRef } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import { toast } from "react-toastify";
import { API_BASE_URL } from "@/src/config/api";
import { getAccessToken, issueAccessToken } from "@/src/lib/auth";
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
  heartbeatTimeoutMs = 60_000, // 프록시 기본 keep-alive(약 60s)보다 약간 짧게
  reconnectIntervalMs = 3_000,
  reconnectMaxIntervalMs = 30_000,
  seenIdsLimit = 200,
}: Params) {
  const prependItems = useNotificationsStore((state) => state.prependItems);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const esRef = useRef<EventSource | EventSourcePolyfill | null>(null);
  const closedRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const onNotificationsRef = useRef(onNotifications);

  useEffect(() => {
    onNotificationsRef.current = onNotifications;
  }, [onNotifications]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    closedRef.current = false;

    const connect = async () => {
      if (closedRef.current) return;

      let token = getAccessToken();
      if (!token) {
        try {
          token = await issueAccessToken();
        } catch (e) {
          console.warn("[notifications:sse] token issue failed", e);
          scheduleReconnect();
          return;
        }
      }
      if (closedRef.current) return;
      console.log("[notifications:sse] token", {
        hasToken: Boolean(token),
        length: token?.length ?? 0,
        prefix: token ? token.slice(0, 10) : null,
      });

      const EventSourceImpl = EventSourcePolyfill;

      console.log("[notifications:sse] connecting...");
      const es = new EventSourceImpl(
        `${API_BASE_URL}/api/notifications/stream`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: false, // JWT 헤더 쓰면 false 권장
          heartbeatTimeout: heartbeatTimeoutMs,
        },
      );

      esRef.current = es;

      es.onopen = () => {
        console.log("[notifications:sse] connected");
        reconnectAttemptRef.current = 0;
      };

      const handleMessage = (event: MessageEvent) => {
        const raw = event?.data;
        if (!raw || typeof raw !== "string") return;

        try {
          const parsed = JSON.parse(raw) as NotificationPayload;
          const list = normalizePayload(parsed);
          if (!list.length) return;

          console.log("[notifications:sse] message", list);

          const handler =
            onNotificationsRef.current ??
            ((items: NotificationItem[]) => prependItems(items));

          handler(list);

          if (toastEnabled) {
            list.forEach((item) => {
              if (!item) return;
              const id = item.id;
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

              const message = item.message?.trim();
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

      es.onerror = async () => {
        const state = esRef.current?.readyState ?? es.readyState;
        console.warn(
          `[notifications:sse] error, reconnecting... readyState=${state}`,
        );
        es.close();

        // 토큰 만료 가능성 → 재발급 시도
        try {
          await issueAccessToken();
        } catch {
          // 무시하고 재연결 시도
        }

        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (closedRef.current) return;
      if (reconnectTimerRef.current) return;

      reconnectAttemptRef.current += 1;
      const base = reconnectIntervalMs * Math.pow(2, reconnectAttemptRef.current - 1);
      const capped = Math.min(base, reconnectMaxIntervalMs);
      const jitter = Math.round(capped * (0.2 * Math.random()));
      const delay = capped + jitter;

      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    };

    connect();

    return () => {
      closedRef.current = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      esRef.current?.close();
      esRef.current = null;
      reconnectAttemptRef.current = 0;
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
