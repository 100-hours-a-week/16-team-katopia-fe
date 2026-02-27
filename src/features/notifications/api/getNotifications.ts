import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type NotificationActor = {
  id: number;
  nicknameSnapshot?: string | null;
  profileImageObjectKeySnapshot?: string | null;
};

export type NotificationItem = {
  id: number;
  type?: string | null;
  message?: string | null;
  referenceId?: number | null;
  actor?: NotificationActor | null;
  createdAt?: string | null;
  readAt?: string | null;
};

export type NotificationsResponse = {
  notifications?: NotificationItem[];
  nextCursor?: string | null;
};

type NotificationApiResponse = {
  data?: NotificationsResponse | NotificationItem[];
  notifications?: NotificationItem[];
  nextCursor?: string | null;
};

export async function getNotifications(params?: {
  size?: number;
  after?: string | null;
}): Promise<NotificationsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.size) searchParams.set("size", String(params.size));
  if (params?.after) {
    searchParams.set("after", params.after);
    searchParams.set("cursor", params.after);
  }
  const query = searchParams.toString();
  const url = query
    ? `${API_BASE_URL}/api/notifications?${query}`
    : `${API_BASE_URL}/api/notifications`;

  const res = await authFetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const result = (await res
    .json()
    .catch(() => ({}))) as NotificationApiResponse;
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    console.log("[notifications] list response", {
      ok: res.ok,
      status: res.status,
      url,
      result,
    });
  }

  if (!res.ok) {
    if (res.status === 401) return { notifications: [], nextCursor: null };
    throw result;
  }

  const data = result.data ?? result;

  if (Array.isArray(data)) {
    return { notifications: data, nextCursor: null };
  }

  return {
    notifications: data.notifications ?? [],
    nextCursor: data.nextCursor ?? null,
  };
}
