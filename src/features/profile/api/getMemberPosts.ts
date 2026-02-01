import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { normalizeImageUrls } from "@/src/features/upload/utils/normalizeImageUrls";

export type MemberPostItem = {
  id: number;
  imageUrl: string;
  createdAt: string;
};

export type GetMemberPostsResponse = {
  posts: MemberPostItem[];
  nextCursor: string | null;
};

/** 🔹 API raw response item */
type RawMemberPost = {
  id: number;
  imageUrls:
    | string
    | string[]
    | { imageObjectKey?: string; imageUrl?: string; accessUrl?: string; url?: string }
    | { imageObjectKey?: string; imageUrl?: string; accessUrl?: string; url?: string }[];
  createdAt: string;
};

export async function getMemberPosts(params: {
  memberId: number;
  size?: number;
  after?: string;
}): Promise<GetMemberPostsResponse> {
  const searchParams = new URLSearchParams();
  if (params.size) searchParams.set("size", String(params.size));
  if (params.after != null) searchParams.set("after", params.after);

  const res = await authFetch(
    `${API_BASE_URL}/api/members/${params.memberId}/posts?${searchParams.toString()}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
  );

  const json = await res.json();
  if (!res.ok) {
    throw json;
  }

  const posts: MemberPostItem[] = (json.data.posts ?? []).map(
    (post: RawMemberPost) => {
      const imageUrl =
        normalizeImageUrls(
          (post as { imageObjectKeys?: unknown }).imageObjectKeys ??
            post.imageUrls,
        )[0] ?? "";

      return {
        id: post.id,
        imageUrl,
        createdAt: post.createdAt,
      };
    },
  );

  return {
    posts,
    nextCursor: json.data.nextCursor ?? null,
  };
}
