import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

type UpdatePostParams = {
  postId: string;
  content: string;
};

export async function updatePost({ postId, content }: UpdatePostParams) {
  const res = await authFetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content, // 🔥 임시: content만 전송
    }),
  });

  const result = await res.json();

  if (!res.ok) {
    throw result;
  }

  return result;
}
