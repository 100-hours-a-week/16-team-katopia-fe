import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type FollowMemberResponse = {
  isFollowing: boolean;
  targetId: number;
  targetNickname: string;
  aggregate?: {
    followerCount?: number;
    followingCount?: number;
  };
};

export async function followMember(
  memberId: number | string,
): Promise<FollowMemberResponse> {
  const res = await authFetch(
    `${API_BASE_URL}/api/members/${memberId}/follow`,
    {
      method: "POST",
    },
  );

  let result: unknown = null;
  try {
    result = await res.json();
  } catch {
    result = null;
  }

  if (!res.ok) {
    throw { ...(result ?? { code: "FOLLOW-UNKNOWN" }), status: res.status };
  }

  const data = (result as { data?: FollowMemberResponse } | null)?.data;
  return (
    data ?? {
      isFollowing: true,
      targetId: Number(memberId),
      targetNickname: "",
    }
  );
}
