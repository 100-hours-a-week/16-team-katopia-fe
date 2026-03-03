import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

type ViewerState = {
  isLiked?: boolean;
  isBookmarked?: boolean;
};

export async function getPostDetailViewerState(
  postId: string,
): Promise<ViewerState | null> {
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
}
