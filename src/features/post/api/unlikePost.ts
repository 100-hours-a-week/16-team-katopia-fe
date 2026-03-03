import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { revalidatePostDetail } from "./revalidatePostDetail";

export type UnlikePostResponse = {
  postId: number;
  likeCount?: number;
};

export async function unlikePost(postId: string): Promise<UnlikePostResponse> {
  const res = await authFetch(`${API_BASE_URL}/api/posts/${postId}/likes`, {
    method: "DELETE",
  });

  let result: unknown = null;
  try {
    result = await res.json();
  } catch {
    result = null;
  }

  if (!res.ok) {
    throw { ...(result ?? { code: "UNLIKE-UNKNOWN" }), status: res.status };
  }

  await revalidatePostDetail(postId);

  const data = (result as { data?: UnlikePostResponse } | null)?.data;
  return data ?? { postId: Number(postId) };
}
