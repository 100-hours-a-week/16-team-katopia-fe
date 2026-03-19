import { useQuery } from "@tanstack/react-query";
import {
  getMemberProfile,
  getMyProfile,
} from "@/src/features/profile/api/getProfile";

export const profileQueryKeys = {
  me: () => ["profile", "me"] as const,
  member: (memberId: number) => ["profile", "member", memberId] as const,
};

export function useMyProfileQuery(enabled = true) {
  return useQuery({
    queryKey: profileQueryKeys.me(),
    queryFn: getMyProfile,
    enabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useMemberProfileQuery(memberId: number, enabled = true) {
  return useQuery({
    queryKey: profileQueryKeys.member(memberId),
    queryFn: () => getMemberProfile(memberId),
    enabled: enabled && Number.isFinite(memberId),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}
