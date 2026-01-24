import { API_BASE_URL } from "@/src/config/api";
import { getAccessToken } from "@/src/lib/auth";

type DeleteCommentParams = {
  postId: string;
  commentId: number;
};

export async function deleteComment({
  postId,
  commentId,
}: DeleteCommentParams) {
  const token = getAccessToken();

  const res = await fetch(
    `${API_BASE_URL}/api/posts/${postId}/comments/${commentId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw error;
  }

  return true;
}
