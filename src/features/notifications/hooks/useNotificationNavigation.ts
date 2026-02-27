import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { NotificationItem } from "@/src/features/notifications/api/getNotifications";

type Params = {
  notifications: NotificationItem[];
  markAsRead: (id: number) => void;
};
const POST_DETAIL_TYPES = new Set(["POST_CREATED", "POST_LIKE", "POST_COMMENT"]);

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const pickFirstNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    const parsed = toNumberOrNull(value);
    if (parsed != null) return parsed;
  }
  return null;
};

export function useNotificationNavigation({
  notifications,
  markAsRead,
}: Params) {
  const router = useRouter();

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
      const resolvedReferenceId = pickFirstNumber(
        target.referenceId,
        (target as { refId?: unknown } | null)?.refId,
        meta?.referenceId,
        meta?.refId,
        meta?.postId,
        meta?.voteId,
        referenceId,
      );
      const resolvedActorId = pickFirstNumber(
        target.actor?.id,
        (target as { actorId?: unknown } | null)?.actorId,
        meta?.actorId,
        meta?.memberId,
        meta?.userId,
        meta?.followerId,
        meta?.id,
        actorId,
      );

      if (!target.readAt) {
        markAsRead(id);
      }

      if (resolvedType === "FOLLOW" && resolvedActorId != null) {
        router.push(`/profile/${resolvedActorId}`);
        return;
      }

      if (
        resolvedType != null &&
        POST_DETAIL_TYPES.has(resolvedType) &&
        resolvedReferenceId != null
      ) {
        router.push(`/post/${resolvedReferenceId}`);
        return;
      }

      if (resolvedType === "VOTE_CLOSED" && resolvedReferenceId != null) {
        router.push(`/vote/${resolvedReferenceId}`);
      }
    },
    [markAsRead, notifications, router],
  );

  return { handleNavigate };
}
