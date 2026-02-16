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

type NotificationApiResponse = {
  data?:
    | NotificationItem[]
    | {
        notifications?: NotificationItem[];
      };
};

export async function getNotifications(): Promise<NotificationItem[]> {
  const res = await authFetch(`${API_BASE_URL}/api/notifications`, {
    method: "GET",
    cache: "no-store",
  });

  const result = (await res.json().catch(() => ({}))) as NotificationApiResponse;

  if (!res.ok) {
    if (res.status === 401) return [];
    throw result;
  }

  const data = result.data ?? result;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.notifications)) return data.notifications;
  return [];
}
