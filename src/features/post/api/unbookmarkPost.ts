import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type UnbookmarkPostResponse = {
  postId: number;
  isBookmarked?: boolean;
};

export async function unbookmarkPost(
  postId: string,
): Promise<UnbookmarkPostResponse> {
  const res = await authFetch(`${API_BASE_URL}/api/posts/${postId}/bookmarks`, {
    method: "DELETE",
  });

  let result: unknown = null;
  try {
    result = await res.json();
  } catch {
    result = null;
  }

  if (!res.ok) {
    throw { ...(result ?? { code: "UNBOOKMARK-UNKNOWN" }), status: res.status };
  }

  const data = (result as { data?: UnbookmarkPostResponse } | null)?.data;
  return data ?? { postId: Number(postId), isBookmarked: false };
}
