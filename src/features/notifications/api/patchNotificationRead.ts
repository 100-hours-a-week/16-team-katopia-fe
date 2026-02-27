import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import type { NotificationItem } from "./getNotifications";

type PatchNotificationResponse = {
  data?: NotificationItem;
};

export async function patchNotificationRead(
  id: number,
): Promise<NotificationItem | null> {
  const res = await authFetch(`${API_BASE_URL}/api/notifications/${id}`, {
    method: "PATCH",
    cache: "no-store",
  });

  const result = (await res
    .json()
    .catch(() => ({}))) as PatchNotificationResponse;

  if (!res.ok) {
    if (res.status === 401) return null;
    throw result;
  }

  return result.data ?? null;
}
