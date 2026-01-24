import { API_BASE_URL } from "@/src/config/api";
import { getAccessToken } from "@/src/lib/auth";

export async function deletePost(postId: string) {
  const token = getAccessToken();

  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw error;
  }

  return true;
}
