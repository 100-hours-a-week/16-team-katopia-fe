import { useEffect, useRef } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/src/config/api";
import {
  clearAccessToken,
  getAccessToken,
  isAccessTokenExpired,
  issueAccessToken,
  notifyAuthInvalid,
} from "@/src/lib/auth";
import { getNotifications } from "@/src/features/notifications/api/getNotifications";
import type { NotificationItem } from "@/src/features/notifications/api/getNotifications";
import { useNotificationsStore } from "@/src/features/notifications/store/notificationsStore";

type NotificationPayload =
  | NotificationItem
  | NotificationItem[]
  | { data?: NotificationItem | NotificationItem[] };

type Params = {
  enabled?: boolean; // SSE 활성화 여부
  onNotifications?: (items: NotificationItem[]) => void; // 외부 핸들러
  toastEnabled?: boolean; // 토스트 표시 여부
  heartbeatTimeoutMs?: number; // 하트비트 타임아웃
  reconnectIntervalMs?: number; // 재연결 기본 간격
  reconnectMaxIntervalMs?: number; // 재연결 최대 간격
  seenIdsLimit?: number; // 토스트 중복 방지 크기
};

const MAX_RETRY = Number.POSITIVE_INFINITY;
const INITIAL_BOOTSTRAP_SIZE = 20;
const TOAST_SEEN_STORAGE_KEY = "notifications:toast-seen-ids";

const isNotificationItem = (value: unknown): value is NotificationItem => {
  // 런타임 타입 가드
  if (!value || typeof value !== "object") return false; // 객체인지 확인
  const candidate = value as { id?: unknown }; // id 확인용 캐스팅
  return typeof candidate.id === "number"; // id가 숫자면 통과
};

const normalizePayload = (payload: NotificationPayload): NotificationItem[] => {
  // 배열로 정규화
  if (payload && typeof payload === "object" && "data" in payload) {
    // data 래핑 형태
    const data = (payload as { data?: NotificationItem | NotificationItem[] })
      ?.data; // data 추출
    if (Array.isArray(data)) return data; // 배열 그대로
    if (isNotificationItem(data)) return [data]; // 단일이면 배열로
    return []; // 알 수 없는 형태
  }

  if (Array.isArray(payload)) return payload; // 원본 배열
  if (isNotificationItem(payload)) return [payload]; // 원본 단일
  return []; // 알 수 없는 형태
};

export function useNotificationStream({
  // 훅 진입
  enabled = true, // 기본 활성화
  onNotifications, // 외부 핸들러
  toastEnabled = true, // 기본 토스트 표시
  heartbeatTimeoutMs = 1000 * 60 * 65, // 65분 (프록시 유휴 종료(약 1h)보다 길게)
  reconnectIntervalMs = 5_000, // 기본 재연결 간격
  reconnectMaxIntervalMs = 60_000, // 최대 재연결 간격
  seenIdsLimit = 200, // 토스트 중복 방지 크기
}: Params) {
  // 파라미터 타입
  const router = useRouter();
  const prependItems = useNotificationsStore((state) => state.prependItems); // 스토어 prepend
  const seenIdsRef = useRef<Set<number>>(new Set()); // 토스트 중복 방지 Set
  const esRef = useRef<EventSource | EventSourcePolyfill | null>(null); // SSE 인스턴스
  const closedRef = useRef(false); // 수동 종료 여부
  const reconnectTimerRef = useRef<number | null>(null); // 재연결 타이머
  const reconnectAttemptRef = useRef(0); // 재연결 시도 횟수
  const tokenRefreshTriedRef = useRef(false); // 토큰 재발급 시도 여부
  const lastActivityRef = useRef<number>(Date.now()); // 마지막 이벤트 시각
  const authFailedRef = useRef(false); // 인증 실패 플래그
  const onNotificationsRef = useRef(onNotifications); // 핸들러 ref
  const bootstrapDoneRef = useRef(false); // 초기 동기화 1회 보장

  const persistSeenIds = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        TOAST_SEEN_STORAGE_KEY,
        JSON.stringify(Array.from(seenIdsRef.current)),
      );
    } catch {
      // 저장소 접근 실패는 토스트 흐름을 막지 않음
    }
  };

  const markSeenId = (id: number) => {
    seenIdsRef.current.add(id);
    if (seenIdsRef.current.size > seenIdsLimit) {
      const first = seenIdsRef.current.values().next().value;
      if (typeof first === "number") {
        seenIdsRef.current.delete(first);
      }
    }
    persistSeenIds();
  };

  useEffect(() => {
    // 핸들러 ref 동기화
    onNotificationsRef.current = onNotifications; // 최신 핸들러 저장
  }, [onNotifications]); // 핸들러 변경 시 업데이트

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(TOAST_SEEN_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;

      seenIdsRef.current = new Set(
        parsed.filter((value): value is number => typeof value === "number"),
      );
    } catch {
      seenIdsRef.current = new Set();
    }
  }, []);

  useEffect(() => {
    // SSE 라이프사이클
    if (!enabled || typeof window === "undefined") return; // 비활성/SSR이면 중단

    const isProd = process.env.NODE_ENV === "production";
    closedRef.current = false; // 활성 상태로 설정

    const notifyToastIfNeeded = (items: NotificationItem[]) => {
      if (!toastEnabled) return;
      items.forEach((item) => {
        const id = item?.id;

        //이미 본 알림 ID면 토스트 스킵
        if (typeof id === "number" && seenIdsRef.current.has(id)) return;

        const message = item?.message?.trim();
        if (!message) return;

        if (typeof id === "number") {
          markSeenId(id);
        }

        toast(message, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: true,
          closeButton: true,
          pauseOnHover: true,
          draggable: true,
          onClick: () => {
            router.push("/notifications");
          },
        });
      });
    };

    const bootstrapNotifications = async () => {
      if (bootstrapDoneRef.current) return;
      bootstrapDoneRef.current = true;

      try {
        const currentItems = useNotificationsStore.getState().items;
        if (currentItems.length > 0) return;

        const data = await getNotifications({ size: INITIAL_BOOTSTRAP_SIZE });
        const initialItems = data.notifications ?? [];
        if (!initialItems.length) return;
        useNotificationsStore.getState().mergeItems(initialItems);
      } catch {
        // 초기 동기화 실패는 SSE/polling 경로로 복구
      }
    };

    const connect = async () => {
      // 연결 루틴
      if (closedRef.current) return; // 이미 닫혔으면 중단
      // 재시도 횟수 제한
      if (reconnectAttemptRef.current >= MAX_RETRY) {
        // 최대 재시도 초과
        if (!isProd) {
          console.warn(
            "[notifications:sse] max retry reached. stop reconnect.",
          ); // 로그
        }
        return; // 종료
      }

      // 이미 열려있으면 중복 연결 방지
      if (esRef.current && esRef.current.readyState === EventSource.OPEN) {
        // 이미 연결됨
        return; // 중복 방지
      }

      let token = getAccessToken(); // 캐시 토큰
      if (!token || isAccessTokenExpired(token)) {
        // 토큰 없으면
        try {
          // 재발급 시도
          token = await issueAccessToken(); // 토큰 발급
        } catch (e) {
          // 발급 실패
          console.warn("[notifications:sse] token issue failed", e); // 로그
          reconnectAttemptRef.current += 1;
          scheduleReconnect();
          return;
        }
      }

      if (!isProd) {
        console.log("[notifications:sse] connecting..."); // 연결 로그
      }

      const streamPath = "/api/notifications/stream";
      const streamUrl = (() => {
        if (typeof window === "undefined") {
          return `${API_BASE_URL}${streamPath}`;
        }
        try {
          const apiOrigin = new URL(API_BASE_URL).origin;
          return window.location.origin === apiOrigin
            ? streamPath
            : `${apiOrigin}${streamPath}`;
        } catch {
          return `${API_BASE_URL}${streamPath}`;
        }
      })();

      const recordActivity = () => {
        // 활동 기록 함수
        lastActivityRef.current = Date.now(); // 현재 시각 저장
      }; // 함수 끝

      recordActivity(); // 연결 시점 활동 기록

      if (esRef.current) {
        // 이전 인스턴스가 남아 있으면 새 연결 전에 정리
        esRef.current.close();
      }

      const es = new EventSourcePolyfill( // SSE 연결 생성
        streamUrl, // 스트림 URL (동일 오리진 우선)
        {
          // 옵션
          headers: {
            // 커스텀 헤더
            Authorization: `Bearer ${token}`, // Bearer 토큰
          }, // 헤더 끝
          withCredentials: true, // fetch(credentials: include)와 일치
          heartbeatTimeout: heartbeatTimeoutMs, // 하트비트 타임아웃
        }, // 옵션 끝
      ); // 생성 끝

      esRef.current = es; // 인스턴스 저장

      es.onopen = () => {
        // 연결 성공 핸들러
        if (!isProd) {
          console.log("[notifications:sse] connected"); // 연결 로그
        }
        reconnectAttemptRef.current = 0; // 재시도 횟수 초기화
        tokenRefreshTriedRef.current = false; // 재발급 플래그 초기화
        recordActivity(); // 활동 기록
      }; // onopen 끝

      const handleMessage = (event: MessageEvent) => {
        // 메시지 핸들러
        const raw = event?.data; // 원본 데이터
        if (!raw || typeof raw !== "string") return; // 문자열 아니면 무시
        recordActivity(); // 활동 기록

        try {
          // JSON 파싱
          const parsed = JSON.parse(raw) as NotificationPayload; // 파싱
          const list = normalizePayload(parsed); // 배열 정규화
          if (!list.length) return; // 비어있으면 무시

          const handler = // 핸들러 선택
            onNotificationsRef.current ?? // 외부 핸들러
            ((items: NotificationItem[]) => prependItems(items)); // 기본 prepend

          handler(list); // 알림 전달
          notifyToastIfNeeded(list);
        } catch {
          // JSON 파싱 실패
          console.warn("[notifications:sse] non-JSON message", raw); // 원본 로그
        } // try/catch 끝
      }; // handleMessage 끝

      es.onmessage = handleMessage; // 기본 메시지 이벤트
      es.addEventListener("notification", handleMessage as EventListener); // 커스텀 이벤트
      es.addEventListener("ping", () => {
        // 하트비트 이벤트
        recordActivity(); // 활동 기록
      }); // ping 핸들러 끝

      es.onerror = async (event) => {
        // 에러 핸들러
        const state = es.readyState; // 현재 상태
        const status = // 상태 코드 추출
          (event as { status?: number } | null)?.status ?? // 직접 status
          (event as { target?: { status?: number } } | null)?.target?.status ?? // target status
          (es as { xhr?: { status?: number } } | null)?.xhr?.status ?? // polyfill xhr
          null; // 기본값
        if (!isProd || status !== null) {
          console.warn(`[notifications:sse] error, readyState=${state}`, {
            // 로그
            status, // 상태 코드
          }); // 로그 끝
        }

        if (closedRef.current) return; // 수동 종료면 무시

        if (status === 401) {
          // 인증 실패 시 1회 재발급 후 재연결 시도
          es.close();
          if (!tokenRefreshTriedRef.current) {
            tokenRefreshTriedRef.current = true;
            try {
              clearAccessToken();
              await issueAccessToken();
              reconnectAttemptRef.current += 1;
              scheduleReconnect();
              return;
            } catch (error) {
              const isAuthInvalid =
                error instanceof Error &&
                (error.message === "AUTH_INVALID" ||
                  error.message === "LOGGED_OUT");
              if (isAuthInvalid) {
                authFailedRef.current = true;
                notifyAuthInvalid();
                return;
              }
              reconnectAttemptRef.current += 1;
              scheduleReconnect();
              return;
            }
          }
          authFailedRef.current = true; // 재발급 후에도 401이면 인증 무효 처리
          notifyAuthInvalid();
          return;
        }

        if (status == null && state === EventSource.CONNECTING) {
          // 일부 프록시/H2 환경에서는 CONNECTING 상태에서 빠른 실패-재시도 루프가 발생한다.
          // 폴리필 내부 자동 재연결에 맡기지 않고 명시적으로 close + 백오프 재연결을 수행한다.
          reconnectAttemptRef.current += 1;
          es.close();
          scheduleReconnect();
          return;
        }

        if (status == null) {
          // status 없는 단절은 명시적으로 재연결
          reconnectAttemptRef.current += 1;
          es.close();
          scheduleReconnect();
          return;
        }

        const inactiveMs = Date.now() - lastActivityRef.current; // 비활동 시간
        es.close(); // 재연결 전 닫기

        if (status && status >= 500) {
          // 서버 에러
          reconnectAttemptRef.current += 1; // 재시도 증가
          const retryDelay = Math.min(
            // 백오프 계산
            reconnectMaxIntervalMs * 2, // 하드 캡
            Math.max(30_000, reconnectIntervalMs * 4), // 최소 30초 또는 4배
          ); // 계산 끝
          if (!isProd) {
            console.warn(
              "[notifications:sse] server error, backoff reconnect",
              {
                // 로그
                status, // 상태 코드
                retryDelay, // 지연 시간
              },
            ); // 로그 끝
          }
          scheduleReconnect(retryDelay); // 재연결 예약
          return; // 종료
        }

        if (inactiveMs < heartbeatTimeoutMs) {
          // 최근 활동 있음
          if (!isProd) {
            console.warn(
              "[notifications:sse] recent activity detected, delay reconnect",
              {
                // 로그
                inactiveMs, // 비활동 시간
              },
            ); // 로그 끝
          }
          scheduleReconnect(); // 재연결 예약
          return; // 종료
        }

        reconnectAttemptRef.current += 1; // 재시도 증가

        // 🔥 토큰 재발급은 1번만 시도
        if (!tokenRefreshTriedRef.current) {
          // 1회만 시도
          tokenRefreshTriedRef.current = true; // 시도 플래그
          try {
            // 토큰 재발급
            await issueAccessToken(); // 토큰 재발급
          } catch {
            // 재발급 실패
            console.warn("[notifications:sse] token refresh failed"); // 경고 로그
          } // try/catch 끝
        } // 재발급 블록 끝

        scheduleReconnect(); // 재연결 예약
      }; // onerror 끝
    };

    const scheduleReconnect = (overrideDelayMs?: number) => {
      // 재연결 스케줄러
      if (closedRef.current) return; // 닫혔으면 중단
      if (authFailedRef.current) return; // 인증 실패면 중단
      if (reconnectTimerRef.current) return; // 이미 예약됨

      if (reconnectAttemptRef.current >= MAX_RETRY) {
        // 최대 재시도 초과
        if (!isProd) {
          console.warn("[notifications:sse] too many retries. stop."); // 로그
        }
        return; // 종료
      }

      const base = // 지수 백오프
        reconnectIntervalMs * Math.pow(2, reconnectAttemptRef.current - 1); // 기본 지연
      const capped = Math.min(base, reconnectMaxIntervalMs); // 최대 지연 제한
      const delay = overrideDelayMs ?? capped; // override 우선

      reconnectTimerRef.current = window.setTimeout(() => {
        // 재연결 예약
        reconnectTimerRef.current = null; // 타이머 ref 정리
        connect(); // 재연결 실행
      }, delay); // 지연 시간
    }; // scheduleReconnect 끝

    bootstrapNotifications();
    connect(); // 최초 연결

    return () => {
      // 언마운트/비활성 정리
      closedRef.current = true; // 닫힘 표시

      if (reconnectTimerRef.current) {
        // 예약된 타이머 정리
        clearTimeout(reconnectTimerRef.current); // 타이머 해제
        reconnectTimerRef.current = null; // ref 초기화
      }

      esRef.current?.close(); // SSE 종료
      esRef.current = null; // SSE ref 초기화
      reconnectAttemptRef.current = 0; // 재시도 초기화
      tokenRefreshTriedRef.current = false; // 재발급 플래그 초기화
      authFailedRef.current = false; // 인증 실패 플래그 초기화
    }; // cleanup 끝
  }, [
    enabled, // 활성화 여부
    toastEnabled, // 토스트 여부
    prependItems, // 스토어 핸들러
    heartbeatTimeoutMs, // 하트비트 타임아웃
    reconnectIntervalMs, // 재연결 기본 간격
    reconnectMaxIntervalMs, // 재연결 최대 간격
    seenIdsLimit, // 중복 방지 크기
    router,
  ]); // effect deps 끝
}
