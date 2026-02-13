import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type BookmarkPostResponse = {
  postId: number;
  isBookmarked?: boolean;
};

export async function bookmarkPost(
  postId: string,
): Promise<BookmarkPostResponse> {
  const res = await authFetch(`${API_BASE_URL}/api/posts/${postId}/bookmarks`, {
    method: "POST",
  });

  let result: unknown = null;
  try {
    result = await res.json();
  } catch {
    result = null;
  }

  if (!res.ok) {
    throw { ...(result ?? { code: "BOOKMARK-UNKNOWN" }), status: res.status };
  }

  const data = (result as { data?: BookmarkPostResponse } | null)?.data;
  return data ?? { postId: Number(postId), isBookmarked: true };
}
