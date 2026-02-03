import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { normalizeImageUrls } from "@/src/features/upload/utils/normalizeImageUrls";

export type SearchPostItem = {
  id: number;
  imageUrls: string[]; // 첫 번째 이미지를 썸네일로 사용
  createdAt: string;
};

export type SearchPostsResponse = {
  posts: SearchPostItem[];
  nextCursor: string | null;
};

export async function searchPosts(params: {
  query: string;
  size?: number;
  after?: string;
  height?: number;
  weight?: number;
  gender?: "M" | "F";
}): Promise<SearchPostsResponse> {
  const searchParams = new URLSearchParams();

  const rawQuery = params.query.trim();
  const isHashtagQuery = rawQuery.startsWith("#");
  const normalizedQuery = isHashtagQuery
    ? (rawQuery.slice(1).trim().match(/^[^#\s]+/)?.[0] ?? "")
    : rawQuery;
  const minLength = isHashtagQuery ? 1 : 2;
  if (normalizedQuery.length < minLength) {
    return { posts: [], nextCursor: null };
  }
  if (isHashtagQuery) {
    searchParams.set("tags", normalizedQuery);
  }
  searchParams.set("query", isHashtagQuery ? rawQuery : normalizedQuery);
  if (params.size) searchParams.set("size", String(params.size));
  if (params.after) searchParams.set("after", params.after);
  if (params.height) searchParams.set("height", String(params.height));
  if (params.weight) searchParams.set("weight", String(params.weight));
  if (params.gender) searchParams.set("gender", params.gender);

  const res = await authFetch(
    `${API_BASE_URL}/api/search/posts?${searchParams.toString()}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
  );

  console.log(searchParams.toString());

  console.log(res);

  const result = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      return { posts: [], nextCursor: null };
    }
    throw result;
  }

  const data = result.data as SearchPostsResponse;
  return {
    ...data,
    posts: (data.posts ?? []).map((post) => ({
      ...post,
      imageUrls: normalizeImageUrls(
        ((post as { imageObjectKeys?: unknown; imageObjectKey?: unknown })
          .imageObjectKeys ??
          (post as { imageObjectKey?: unknown }).imageObjectKey ??
          post.imageUrls) as unknown as
          | string[]
          | { imageObjectKey?: string; imageUrl?: string; accessUrl?: string; url?: string }[],
      ),
    })),
  };
}
