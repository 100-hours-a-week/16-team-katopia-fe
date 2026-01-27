import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

type DeleteCommentParams = {
  postId: string;
  commentId: number;
};

export async function deleteComment({
  postId,
  commentId,
}: DeleteCommentParams) {
  const res = await authFetch(
    `${API_BASE_URL}/api/posts/${postId}/comments/${commentId}`,
    {
      method: "DELETE",
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw error;
  }

  return true;
}
