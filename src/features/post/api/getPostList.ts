import { API_BASE_URL } from "@/src/config/api";

type PostListItem = {
  id: number;
  imageUrls: string[];
};

type GetPostListResponse = {
  posts: PostListItem[];
  nextCursor: number | null;
};

export async function getPostList(params?: {
  size?: number;
  after?: number;
}): Promise<GetPostListResponse> {
  const searchParams = new URLSearchParams();

  if (params?.size) searchParams.set("size", String(params.size));
  if (params?.after) searchParams.set("after", String(params.after));

  const res = await fetch(
    `${API_BASE_URL}/api/posts?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const result = await res.json();

  if (!res.ok) {
    throw result;
  }

  return result.data;
}
