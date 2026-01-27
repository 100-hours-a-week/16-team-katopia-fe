import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export async function deletePost(postId: string) {
  const res = await authFetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw error;
  }

  return true;
}
