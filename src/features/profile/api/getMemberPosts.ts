import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

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
  imageUrls: string | string[];
  createdAt: string;
};

export async function getMemberPosts(params: {
  memberId: number;
  size?: number;
  after?: string;
}): Promise<GetMemberPostsResponse> {
  const searchParams = new URLSearchParams();
  if (params.size) searchParams.set("size", String(params.size));
  if (params.after) searchParams.set("after", params.after);

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
      const imageUrl = Array.isArray(post.imageUrls)
        ? post.imageUrls[0]
        : post.imageUrls;

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
