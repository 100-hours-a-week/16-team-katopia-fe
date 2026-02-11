import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type UnfollowMemberResponse = {
  isFollowing: boolean;
  targetId: number;
  targetNickname: string;
  aggregate?: {
    followerCount?: number;
    followingCount?: number;
  };
};

export async function unfollowMember(
  memberId: number | string,
): Promise<UnfollowMemberResponse> {
  const res = await authFetch(
    `${API_BASE_URL}/api/members/${memberId}/follow`,
    {
      method: "DELETE",
    },
  );

  let result: unknown = null;
  try {
    result = await res.json();
  } catch {
    result = null;
  }

  if (!res.ok) {
    throw { ...(result ?? { code: "UNFOLLOW-UNKNOWN" }), status: res.status };
  }

  const data = (result as { data?: UnfollowMemberResponse } | null)?.data;
  return (
    data ?? {
      isFollowing: false,
      targetId: Number(memberId),
      targetNickname: "",
    }
  );
}
