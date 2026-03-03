import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type CreateCommentParams = {
  postId: string;
  content: string;
};

export type CreateCommentResponse = {
  id: number;
  content: string;
  createdAt: string;
};

export async function createComment({
  postId,
  content,
}: CreateCommentParams): Promise<CreateCommentResponse> {
  const res = await authFetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  const result = await res.json();

  if (!res.ok) {
    throw result; // COMMENT-E-xxx
  }

  return result.data;
}
