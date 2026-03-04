import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

const inFlightPostDetail = new Map<string, Promise<unknown>>();

type GetPostDetailOptions = {
  forceFresh?: boolean;
};

function getInFlightKey(postId: string, options?: GetPostDetailOptions) {
  return `${postId}:${options?.forceFresh ? "fresh" : "default"}`;
}

export async function getPostDetail(
  postId: string,
  options?: GetPostDetailOptions,
) {
  const inFlightKey = getInFlightKey(postId, options);
  const existing = inFlightPostDetail.get(inFlightKey);
  if (existing) return existing;

  const request = (async () => {
    const res = await authFetch(`${API_BASE_URL}/api/posts/${postId}`, {
      cache: options?.forceFresh ? "no-store" : undefined,
      headers: options?.forceFresh
        ? {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          }
        : undefined,
    });

    const result = await res.json();

    console.log(result);

    if (!res.ok) {
      throw result;
    }

    return result;
  })();

  inFlightPostDetail.set(inFlightKey, request);
  try {
    return await request;
  } finally {
    inFlightPostDetail.delete(inFlightKey);
  }
}
