import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { normalizeImageUrls } from "@/src/features/upload/utils/normalizeImageUrls";

export type HomeAuthor = {
  id: number;
  nickname: string;
  profileImageObjectKey?: string | null;
  profileImageUrl?: string | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
};

export type HomePostApiItem = {
  id: number;
  imageObjectKeys?: {
    sortOrder?: number | null;
    imageObjectKey?: string | null;
    imageUrl?: string | null;
    accessUrl?: string | null;
    url?: string | null;
  }[];
  content?: string | null;
  tags?: string[] | null;
  isLiked?: boolean | null;
  isBookmarked?: boolean | null;
  author?: HomeAuthor | null;
  aggregate?: {
    likeCount?: number | null;
    commentCount?: number | null;
  } | null;
  createdAt?: string | null;
};

export type GetHomePostsResponse = {
  posts: Array<HomePostApiItem & { imageUrls: string[] }>;
  nextCursor: string | null;
};

function normalizeHomeImageUrls(post: HomePostApiItem) {
  const rawKeys = post.imageObjectKeys ?? [];
  if (!Array.isArray(rawKeys) || rawKeys.length === 0) {
    const fallback =
      (
        post as {
          imageObjectKey?: unknown;
          imageUrls?: unknown;
          imageUrl?: unknown;
        }
      ).imageObjectKey ??
      (post as { imageUrls?: unknown }).imageUrls ??
      (post as { imageUrl?: unknown }).imageUrl ??
      [];
    return normalizeImageUrls(fallback as never);
  }
  const sorted = [...rawKeys].sort(
    (a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0),
  );
  return normalizeImageUrls(
    sorted as unknown as Array<{ imageObjectKey?: string }>,
  );
}

export async function getHomePosts(params?: {
  size?: number;
  after?: string;
}): Promise<GetHomePostsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.size) searchParams.set("size", String(params.size));
  if (params?.after) searchParams.set("after", params.after);

  const res = await authFetch(
    `${API_BASE_URL}/api/home/posts?${searchParams.toString()}`,
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

  const data = (result.data ?? result) as GetHomePostsResponse;

  return {
    ...data,
    posts: (data.posts ?? []).map((post) => {
      const imageUrls = normalizeHomeImageUrls(post);
      return {
        ...post,
        imageObjectKeys: undefined,
        imageUrls,
      };
    }),
  };
}
