import { API_BASE_URL } from "@/src/config/api";
import {
  clearAccessToken,
  getAccessToken,
  isAccessTokenExpired,
  issueAccessToken,
} from "@/src/lib/auth";
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

export type HomePostsFetchOptions = {
  cookieHeader?: string | null;
  size?: number;
  after?: string | null;
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

function normalizeHomePostsResponse(result: unknown): GetHomePostsResponse {
  const data =
    (result as { data?: GetHomePostsResponse })?.data ??
    (result as GetHomePostsResponse);

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

function buildHomePostsQuery(params?: {
  size?: number;
  after?: string | null;
}) {
  const searchParams = new URLSearchParams();

  if (params?.size) searchParams.set("size", String(params.size));
  if (params?.after) searchParams.set("after", params.after);
  return searchParams.toString();
}

function buildHomePostsUpstreamUrl(params?: {
  size?: number;
  after?: string | null;
}) {
  const query = buildHomePostsQuery(params);
  return query
    ? `${API_BASE_URL}/api/home/posts?${query}`
    : `${API_BASE_URL}/api/home/posts`;
}

export async function getHomePosts(params?: {
  size?: number;
  after?: string;
}): Promise<GetHomePostsResponse> {
  const url = buildHomePostsUpstreamUrl(params);
  let res: Response;
  try {
    const existing = getAccessToken();
    const candidateToken =
      existing && !isAccessTokenExpired(existing) ? existing : null;

    res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers: candidateToken
        ? {
            Authorization: `Bearer ${candidateToken}`,
          }
        : undefined,
    });

    // 토큰 발급을 선행하지 않고, 401일 때만 재발급 후 1회 재시도합니다.
    if (res.status === 401) {
      clearAccessToken();
      const refreshed = await issueAccessToken();
      res = await fetch(url, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${refreshed}`,
        },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      message === "AUTH_INVALID" ||
      message === "LOGGED_OUT" ||
      message === "REFRESH_FAILED"
    ) {
      return { posts: [], nextCursor: null };
    }
    throw error;
  }

  const result = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      return { posts: [], nextCursor: null };
    }
    throw result;
  }

  return normalizeHomePostsResponse(result);
}

async function issueServerAccessToken(
  cookieHeader?: string | null,
): Promise<string | null> {
  if (!cookieHeader) return null;
  const tokenRes = await fetch(`${API_BASE_URL}/api/auth/tokens`, {
    method: "POST",
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (!tokenRes.ok) return null;

  const tokenJson = (await tokenRes.json().catch(() => null)) as {
    data?: { accessToken?: string | null };
  } | null;
  return tokenJson?.data?.accessToken ?? null;
}

export async function getHomePostsServer(
  options: HomePostsFetchOptions = {},
): Promise<GetHomePostsResponse> {
  const token = await issueServerAccessToken(options.cookieHeader);
  if (!token) return { posts: [], nextCursor: null };

  const res = await fetch(
    buildHomePostsUpstreamUrl({
      size: options.size,
      after: options.after ?? undefined,
    }),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    if (res.status === 401) return { posts: [], nextCursor: null };
    throw new Error(`Failed to fetch home posts: ${res.status}`);
  }

  const result = await res.json().catch(() => ({}));
  return normalizeHomePostsResponse(result);
}
