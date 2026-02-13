import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";

export type HomeMemberApiItem = {
  id: number;
  nickname: string;
  profileImageObjectKey?: string | null;
  profileImageUrl?: string | null;
  height?: number | null;
  weight?: number | null;
  styles?: string[] | null;
};

export type GetHomeMembersResponse = {
  members: HomeMemberApiItem[];
};

export async function getHomeMembers(): Promise<GetHomeMembersResponse> {
  const res = await authFetch(`${API_BASE_URL}/api/home/members`, {
    method: "GET",
    cache: "no-store",
  });

  const result = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      return { members: [] };
    }
    throw result;
  }

  const data = (result.data ?? result) as GetHomeMembersResponse;
  const members = (data.members ?? []).map((member) => {
    const avatarKey =
      member.profileImageObjectKey ?? member.profileImageUrl ?? null;
    return {
      ...member,
      profileImageUrl: avatarKey ? resolveMediaUrl(avatarKey) : null,
    } as HomeMemberApiItem & { profileImageUrl: string | null };
  });

  return { members };
}
