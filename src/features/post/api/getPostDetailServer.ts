import "server-only";

import { API_BASE_URL } from "@/src/config/api";
import { getPostDetailTag } from "./postDetailCache";
import type { PostDetail } from "@/src/features/post/types/postDetail";

type PostDetailApiResponse = {
  data?: PostDetail;
};

function getInstanceId() {
  return (
    process.env.HOSTNAME ??
    process.env.VERCEL_REGION ??
    process.env.K_SERVICE ??
    "unknown-instance"
  );
}

export async function getPostDetailServer(
  postId: string,
): Promise<PostDetail | null> {
  const serverApiBaseUrl = process.env.API_BASE_URL ?? API_BASE_URL;
  const detailTag = getPostDetailTag(postId);
  const detailUrl = `${serverApiBaseUrl}/api/posts/${postId}`;
  let res: Response;

  try {
    res = await fetch(detailUrl, {
      cache: "force-cache",
      next: {
        tags: [detailTag],
        revalidate: 3600,
      },
    });
  } catch (error) {
    console.error("[getPostDetailServer] failed to fetch post detail", {
      postId,
      serverApiBaseUrl,
      detailTag,
      detailUrl,
      instanceId: getInstanceId(),
      error,
    });
    return null;
  }

  const json = (await res.json().catch(() => null)) as PostDetailApiResponse;
  if (!res.ok) {
    console.warn("[getPostDetailServer] non-ok response", {
      postId,
      status: res.status,
      detailTag,
      detailUrl,
      instanceId: getInstanceId(),
    });
    return null;
  }
  console.info("[getPostDetailServer] served", {
    postId,
    detailTag,
    detailUrl,
    instanceId: getInstanceId(),
  });
  return json?.data ?? null;
}
