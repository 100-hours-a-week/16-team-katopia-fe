import { API_BASE_URL } from "@/src/config/api";
import { getAccessToken } from "@/src/lib/auth";

export async function getPostDetail(postId: string) {
  const token = getAccessToken();

  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await res.json();

  console.log(result);

  if (!res.ok) {
    throw result;
  }

  return result;
}
