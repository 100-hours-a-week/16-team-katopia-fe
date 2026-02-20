import { useEffect, useState } from "react";
import { getHomeMembers } from "@/src/features/home/api/getHomeMembers";

export type HomeRecommendationMember = {
  id: number;
  name: string;
  heightCm: number;
  weightKg: number;
  styles: string[];
  avatarUrl?: string | null;
};

export function useHomeRecommendations(enabled: boolean) {
  const [recommendations, setRecommendations] = useState<
    HomeRecommendationMember[]
  >([]);

  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecommendations([]);
      return;
    }

    let cancelled = false;

    const fetchRecommendations = async () => {
      try {
        const data = await getHomeMembers();
        if (cancelled) return;
        const mapped = (data.members ?? []).map((member) => ({
          id: member.id,
          name: member.nickname ?? "",
          heightCm: member.height ?? 0,
          weightKg: member.weight ?? 0,
          styles: member.styles ?? [],
          avatarUrl: member.profileImageUrl ?? null,
        }));
        setRecommendations(mapped);
      } catch {
        if (cancelled) return;
        setRecommendations([]);
      }
    };

    fetchRecommendations();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return recommendations;
}
