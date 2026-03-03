import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

type ViewerState = {
  isLiked?: boolean;
  isBookmarked?: boolean;
};

const inFlightViewerState = new Map<string, Promise<ViewerState | null>>();

export async function getPostDetailViewerState(
  postId: string,
): Promise<ViewerState | null> {
  const key = postId;
  const existing = inFlightViewerState.get(key);
  if (existing) return existing;

  const request = (async () => {
    const res = await authFetch(`${API_BASE_URL}/api/posts/${postId}`, {
      method: "GET",
      cache: "no-store",
    });

    const result = await res.json().catch(() => null);
    if (!res.ok) throw result;

    return {
      isLiked: result?.data?.isLiked,
      isBookmarked: result?.data?.isBookmarked,
    };
  })();

  inFlightViewerState.set(key, request);
  try {
    return await request;
  } finally {
    inFlightViewerState.delete(key);
  }
}
