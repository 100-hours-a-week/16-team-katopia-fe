import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type CommentAuthor = {
  id: number | string;
  nickname: string;
  profileImageUrl?: string | null;
  profileImageObjectKey?: string | null;
};

export type CommentItemResponse = {
  id: number;
  author: CommentAuthor;
  content: string;
  createdAt: string;
};

export type GetCommentsResponse = {
  comments: CommentItemResponse[];
  nextCursor?: number | string | null;
};

const inFlightComments = new Map<string, Promise<GetCommentsResponse>>();

export async function getComments(
  postId: string,
  params?: { size?: number; after?: number | string },
): Promise<GetCommentsResponse> {
  const search = new URLSearchParams();

  if (params?.size != null) {
    search.set("size", String(params.size));
  }
  if (params?.after != null) {
    search.set("after", String(params.after));
  }

  const query = search.toString();
  const key = `${postId}?${query}`;
  const existing = inFlightComments.get(key);
  if (existing) return existing;

  const request = (async () => {
    const res = await authFetch(
      `${API_BASE_URL}/api/posts/${postId}/comments${query ? `?${query}` : ""}`,
      {},
    );

    const result = await res.json();

    if (!res.ok) {
      throw result;
    }

    return result.data as GetCommentsResponse;
  })();

  inFlightComments.set(key, request);
  try {
    return await request;
  } finally {
    inFlightComments.delete(key);
  }
}
