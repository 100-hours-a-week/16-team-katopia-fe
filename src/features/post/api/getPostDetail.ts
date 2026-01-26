import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export async function getPostDetail(postId: string) {
  const res = await authFetch(`${API_BASE_URL}/api/posts/${postId}`);

  const result = await res.json();

  console.log(result);

  if (!res.ok) {
    throw result;
  }

  return result;
}
