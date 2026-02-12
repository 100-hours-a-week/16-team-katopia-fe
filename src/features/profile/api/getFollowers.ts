import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type FollowerMember = {
  followId: number;
  createdAt: string;
  id: number;
  nickname: string;
  profileImageObjectKey?: string | null;
};

export type GetFollowersResponse = {
  members: FollowerMember[];
  nextCursor: string | null;
};

type GetFollowersParams = {
  memberId: number | string;
  cursor?: string | null;
  size?: number;
};

export async function getFollowers({
  memberId,
  cursor,
  size = 20,
}: GetFollowersParams): Promise<GetFollowersResponse> {
  const params = new URLSearchParams();
  params.set("size", String(size));
  if (cursor) params.set("cursor", cursor);

  const res = await authFetch(
    `${API_BASE_URL}/api/members/${memberId}/followers?${params.toString()}`,
    { method: "GET" },
  );

  let result: unknown = null;
  try {
    result = await res.json();
  } catch {
    result = null;
  }

  if (!res.ok) {
    throw {
      ...(result ?? { code: "FOLLOWERS-UNKNOWN" }),
      status: res.status,
    };
  }

  const data = (result as { data?: GetFollowersResponse } | null)?.data;
  return (
    data ?? {
      members: [],
      nextCursor: null,
    }
  );
}
