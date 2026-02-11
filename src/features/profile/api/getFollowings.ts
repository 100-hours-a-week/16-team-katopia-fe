import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type FollowingMember = {
  followId: number;
  createdAt: string;
  id: number;
  nickname: string;
  profileImageObjectKey?: string | null;
};

export type GetFollowingsResponse = {
  members: FollowingMember[];
  nextCursor: string | null;
};

type GetFollowingsParams = {
  memberId: number | string;
  cursor?: string | null;
  size?: number;
};

export async function getFollowings({
  memberId,
  cursor,
  size = 20,
}: GetFollowingsParams): Promise<GetFollowingsResponse> {
  const params = new URLSearchParams();
  params.set("size", String(size));
  if (cursor) params.set("cursor", cursor);

  const res = await authFetch(
    `${API_BASE_URL}/api/members/${memberId}/followings?${params.toString()}`,
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
      ...(result ?? { code: "FOLLOWINGS-UNKNOWN" }),
      status: res.status,
    };
  }

  const data = (result as { data?: GetFollowingsResponse } | null)?.data;
  return (
    data ?? {
      members: [],
      nextCursor: null,
    }
  );
}
