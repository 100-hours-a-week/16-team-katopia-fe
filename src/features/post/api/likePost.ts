import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { revalidatePostDetail } from "./revalidatePostDetail";

export type LikePostResponse = {
  postId: number;
  likeCount?: number;
};

export async function likePost(postId: string): Promise<LikePostResponse> {
  const res = await authFetch(`${API_BASE_URL}/api/posts/${postId}/likes`, {
    method: "POST",
  });

  let result: unknown = null;
  try {
    result = await res.json();
  } catch {
    result = null;
  }

  if (!res.ok) {
    throw { ...(result ?? { code: "LIKE-UNKNOWN" }), status: res.status };
  }

  await revalidatePostDetail(postId);

  const data = (result as { data?: LikePostResponse } | null)?.data;
  return data ?? { postId: Number(postId) };
}
