import "server-only";

import { API_BASE_URL } from "@/src/config/api";
import { getPostDetailTag } from "./postDetailCache";
import type { PostDetail } from "@/src/features/post/types/postDetail";

type PostDetailApiResponse = {
  data?: PostDetail;
};

export async function getPostDetailServer(
  postId: string,
): Promise<PostDetail | null> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    cache: "force-cache",
    next: {
      tags: [getPostDetailTag(postId)],
    },
  });

  const json = (await res.json().catch(() => null)) as PostDetailApiResponse;
  if (!res.ok) return null;
  return json?.data ?? null;
}
