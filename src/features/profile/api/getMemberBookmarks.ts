import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { normalizeImageUrls } from "@/src/features/upload/utils/normalizeImageUrls";

export type BookmarkPostItem = {
  id: number;
  imageObjectKey?: string | null;
  createdAt?: string | null;
};

export type GetMemberBookmarksResponse = {
  posts: Array<BookmarkPostItem & { imageUrls: string[] }>;
  nextCursor: string | null;
};

export async function getMemberBookmarks(params?: {
  size?: number;
  after?: string;
}): Promise<GetMemberBookmarksResponse> {
  const searchParams = new URLSearchParams();

  if (params?.size) searchParams.set("size", String(params.size));
  if (params?.after) searchParams.set("after", params.after);

  const res = await authFetch(
    `${API_BASE_URL}/api/members/me/bookmarks?${searchParams.toString()}`,
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

  const data = (result.data ?? result) as {
    posts?: BookmarkPostItem[];
    nextCursor?: string | null;
  };

  return {
    posts: (data.posts ?? []).map((post) => ({
      ...post,
      imageUrls: normalizeImageUrls(post.imageObjectKey ?? null),
    })),
    nextCursor: data.nextCursor ?? null,
  };
}
