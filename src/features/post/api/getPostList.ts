import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { normalizeImageUrls } from "@/src/features/upload/utils/normalizeImageUrls";

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

  const res = await authFetch(
    `${API_BASE_URL}/api/posts?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const result = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      return { posts: [], nextCursor: null };
    }
    throw result;
  }

  const data = result.data as GetPostListResponse;
  return {
    ...data,
    posts: (data.posts ?? []).map((post) => ({
      ...post,
      imageUrls: normalizeImageUrls(
        post.imageUrls as unknown as
          | string[]
          | { imageUrl?: string; accessUrl?: string; url?: string }[],
      ),
    })),
  };
}
