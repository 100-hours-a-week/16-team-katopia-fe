import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

type UpdateCommentParams = {
  postId: string;
  commentId: number;
  content: string;
};

export async function updateComment({
  postId,
  commentId,
  content,
}: UpdateCommentParams) {
  const res = await authFetch(
    `${API_BASE_URL}/api/posts/${postId}/comments/${commentId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    },
  );

  const result = await res.json();

  if (!res.ok) {
    throw result;
  }

  return result.data;
}
