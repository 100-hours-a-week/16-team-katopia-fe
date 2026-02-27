import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";
import type { HomeRecommendationMember } from "@/src/features/home/types/recommendation";

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

export type HomeMembersFetchOptions = {
  // app router 서버 컴포넌트에서 전달한 Cookie 헤더 문자열
  cookieHeader?: string | null;
  // Next fetch revalidate(seconds)
  revalidate?: number;
};

function normalizeHomeMembersResponse(result: unknown): GetHomeMembersResponse {
  // 백엔드 응답이 { data } 래핑/비래핑 두 케이스 모두 대응
  const data =
    (result as { data?: GetHomeMembersResponse })?.data ??
    (result as GetHomeMembersResponse);
  const members = (data?.members ?? []).map((member) => {
    const avatarKey = member.profileImageObjectKey ?? null;
    return {
      ...member,
      profileImageUrl: avatarKey ? resolveMediaUrl(avatarKey) : null,
    } as HomeMemberApiItem & { profileImageUrl: string | null };
  });
  return { members };
}

export function toRecommendationMembers(
  members: HomeMemberApiItem[],
): HomeRecommendationMember[] {
  // UI 모델을 API 모델에서 분리해서 서버/클라 공용으로 재사용
  return (members ?? []).map((member) => ({
    id: member.id,
    name: member.nickname ?? "",
    heightCm: member.height ?? 0,
    weightKg: member.weight ?? 0,
    styles: member.styles ?? [],
    avatarUrl: member.profileImageUrl ?? null,
  }));
}

export async function getHomeMembers(): Promise<GetHomeMembersResponse> {
  // 클라이언트 패칭 경로: 개인화 데이터이므로 기존 no-store 유지
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

  return normalizeHomeMembersResponse(result);
}

async function issueServerAccessToken(
  cookieHeader?: string | null,
): Promise<string | null> {
  // 서버 컴포넌트에서는 브라우저 sessionStorage 기반 authFetch를 쓸 수 없어서
  // refresh token cookie로 access token을 직접 재발급한다.
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

export async function getHomeMembersServer(
  options: HomeMembersFetchOptions = {},
): Promise<GetHomeMembersResponse> {
  // 토큰 발급 실패/미인증은 추천 섹션을 빈 상태로 안전 처리
  const token = await issueServerAccessToken(options.cookieHeader);
  if (!token) return { members: [] };

  const res = await fetch(`${API_BASE_URL}/api/home/members`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    // ISR 핵심: 동일 요청은 revalidate 윈도우 동안 캐시 재사용
    next: { revalidate: options.revalidate ?? 60 },
  });

  if (!res.ok) {
    if (res.status === 401) return { members: [] };
    throw new Error(`Failed to fetch home members: ${res.status}`);
  }

  const result = await res.json().catch(() => ({}));
  return normalizeHomeMembersResponse(result);
}
