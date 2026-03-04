import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

const inFlightPostDetail = new Map<string, Promise<unknown>>();

export async function getPostDetail(postId: string) {
  const existing = inFlightPostDetail.get(postId);
  if (existing) return existing;

  const request = (async () => {
    const res = await authFetch(`${API_BASE_URL}/api/posts/${postId}`);

    const result = await res.json();

    if (!res.ok) {
      throw result;
    }

    return result;
  })();

  inFlightPostDetail.set(postId, request);
  try {
    return await request;
  } finally {
    inFlightPostDetail.delete(postId);
  }
}
