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
  const detailUrl = `${serverApiBaseUrl}/api/posts/${postId}`;
  let res: Response;

  try {
    res = await fetch(detailUrl, {
      cache: "force-cache",
      next: {
        tags: [getPostDetailTag(postId)],
        revalidate: false,
      },
    });
  } catch (error) {
    console.error("[getPostDetailServer] failed to fetch post detail", {
      postId,
      serverApiBaseUrl,
      detailUrl,
      error,
    });
    return null;
  }

  const json = (await res.json().catch(() => null)) as PostDetailApiResponse;
  if (!res.ok) {
    console.warn("[getPostDetailServer] non-ok response", {
      postId,
      status: res.status,
      detailUrl,
    });
    return null;
  }
  return json?.data ?? null;
}
