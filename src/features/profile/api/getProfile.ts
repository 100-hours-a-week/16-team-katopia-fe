import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { extractProfileCounts } from "@/src/features/profile/utils/extractProfileCounts";

type ApiProfile = {
  nickname?: string | null;
  profileImageUrl?: string | null;
  profileImageObjectKey?: string | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  height?: number | null;
  weight?: number | null;
  style?: string[] | null;
  enableRealtimeNotification?: boolean | null;
};

type ProfileResponseData = {
  id?: number | null;
  profile?: ApiProfile | null;
  isFollowing?: boolean | null;
  followed?: boolean | null;
  isFollow?: boolean | null;
  following?: boolean | null;
};

export type ProfileCounts = {
  postCount: number | null;
  followerCount: number | null;
  followingCount: number | null;
};

export type NormalizedProfile = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  gender: "male" | "female" | null;
  height: number | null;
  weight: number | null;
  style: string[];
  enableRealtimeNotification?: boolean;
};

export type MyProfileQueryData = {
  profile: NormalizedProfile;
  counts: ProfileCounts;
};

export type MemberProfileQueryData = {
  profile: NormalizedProfile;
  counts: ProfileCounts;
  isFollowing: boolean | null;
};

function normalizeGender(gender?: string | null) {
  if (gender === "M" || gender === "MALE") return "male";
  if (gender === "F" || gender === "FEMALE") return "female";
  return null;
}

function normalizeProfile(profile: ApiProfile, userId: number): NormalizedProfile {
  return {
    userId,
    nickname: profile.nickname ?? "",
    profileImageUrl:
      profile.profileImageObjectKey ?? profile.profileImageUrl ?? null,
    gender: normalizeGender(profile.gender),
    height: profile.heightCm ?? profile.height ?? null,
    weight: profile.weightKg ?? profile.weight ?? null,
    style: profile.style ?? [],
    enableRealtimeNotification:
      typeof profile.enableRealtimeNotification === "boolean"
        ? profile.enableRealtimeNotification
        : undefined,
  };
}

function extractFollowing(data: ProfileResponseData) {
  const nested = data.profile as
    | (ApiProfile & {
        isFollowing?: boolean | null;
        followed?: boolean | null;
        isFollow?: boolean | null;
        following?: boolean | null;
      })
    | null
    | undefined;

  const raw =
    data.isFollowing ??
    data.followed ??
    data.isFollow ??
    data.following ??
    nested?.isFollowing ??
    nested?.followed ??
    nested?.isFollow ??
    nested?.following;

  return typeof raw === "boolean" ? raw : null;
}

export async function getMyProfile(): Promise<MyProfileQueryData> {
  const res = await authFetch(`${API_BASE_URL}/api/members/me`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("내 정보 조회 실패");
  }

  const json = await res.json();
  const data = (json?.data ?? {}) as ProfileResponseData;
  if (!data.profile || typeof data.id !== "number") {
    throw new Error("내 정보 응답이 올바르지 않습니다.");
  }

  return {
    profile: normalizeProfile(data.profile, data.id),
    counts: extractProfileCounts(json),
  };
}

export async function getMemberProfile(
  memberId: number,
): Promise<MemberProfileQueryData> {
  const res = await authFetch(`${API_BASE_URL}/api/members/${memberId}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("프로필 조회 실패");
  }

  const json = await res.json();
  const data = (json?.data ?? {}) as ProfileResponseData;
  if (!data.profile) {
    throw new Error("사용자를 찾을 수 없습니다.");
  }

  const resolvedUserId =
    typeof data.id === "number" && !Number.isNaN(data.id) ? data.id : memberId;

  return {
    profile: normalizeProfile(data.profile, resolvedUserId),
    counts: extractProfileCounts(json),
    isFollowing: extractFollowing(data),
  };
}
