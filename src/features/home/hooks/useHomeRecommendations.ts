import { useEffect, useState } from "react";
import { getHomeMembers } from "@/src/features/home/api/getHomeMembers";
import type { HomeRecommendationMember } from "@/src/features/home/types/recommendation";
import { toRecommendationMembers } from "@/src/features/home/api/getHomeMembers";

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
        const mapped = toRecommendationMembers(data.members ?? []);
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
