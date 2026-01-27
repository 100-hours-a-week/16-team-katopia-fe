import { API_BASE_URL } from "@/src/config/api";
import { getAccessToken } from "@/src/lib/auth";

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

  searchParams.set("query", params.query.trim());
  if (params.size) searchParams.set("size", String(params.size));
  if (params.after) searchParams.set("after", params.after);
  if (params.height) searchParams.set("height", String(params.height));
  if (params.weight) searchParams.set("weight", String(params.weight));
  if (params.gender) searchParams.set("gender", params.gender);

  const token = getAccessToken();
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `${API_BASE_URL}/api/search/posts?${searchParams.toString()}`,
    {
      method: "GET",
      headers,
      credentials: "include",
      cache: "no-store",
    },
  );

  console.log(searchParams.toString());

  console.log(res);

  const result = await res.json();
  if (!res.ok) {
    throw result;
  }

  return result.data;
}
