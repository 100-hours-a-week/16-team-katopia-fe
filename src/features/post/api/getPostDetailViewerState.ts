import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

type ViewerState = {
  isLiked?: boolean;
  isBookmarked?: boolean;
  likeCount?: number;
  commentCount?: number;
};

const inFlightViewerState = new Map<string, Promise<ViewerState | null>>();

function pickBoolean(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["y", "yes", "true", "1"].includes(normalized)) return true;
      if (["n", "no", "false", "0"].includes(normalized)) return false;
    }
    if (typeof value === "number") {
      if (value === 1) return true;
      if (value === 0) return false;
    }
  }
  return undefined;
}

export async function getPostDetailViewerState(
  postId: string,
): Promise<ViewerState | null> {
  const key = postId;
  const existing = inFlightViewerState.get(key);
  if (existing) return existing;

  const request = (async () => {
    const res = await authFetch(
      `${API_BASE_URL}/api/posts/${postId}/viewer-state`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    const result = await res.json().catch(() => null);
    if (!res.ok) throw result;

    const data = result?.data ?? result;

    return {
      isLiked: pickBoolean(
        data?.isLiked,
        data?.isLike,
        data?.likeYn,
        data?.likedYn,
      ),
      isBookmarked: pickBoolean(
        data?.isBookmarked,
        data?.isBookmark,
        data?.bookmarkYn,
        data?.bookmarkedYn,
      ),
    };
  })();

  inFlightViewerState.set(key, request);
  try {
    return await request;
  } finally {
    inFlightViewerState.delete(key);
  }
}
