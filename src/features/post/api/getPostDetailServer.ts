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
  const serverApiBaseUrl = process.env.API_BASE_URL ?? API_BASE_URL;
  let res: Response;

  try {
    res = await fetch(`${serverApiBaseUrl}/api/posts/${postId}`, {
      cache: "force-cache",
      next: {
        tags: [getPostDetailTag(postId)],
        revalidate: 3600,
      },
    });
  } catch (error) {
    console.error("[getPostDetailServer] failed to fetch post detail", {
      postId,
      serverApiBaseUrl,
      error,
    });
    return null;
  }

  const json = (await res.json().catch(() => null)) as PostDetailApiResponse;
  if (!res.ok) return null;
  return json?.data ?? null;
}
