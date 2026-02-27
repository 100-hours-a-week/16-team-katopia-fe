import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";

type VoteCandidateItem = {
  id: number | string;
  imageObjectKey?: string | null;
  imageUrl?: string | null;
  accessUrl?: string | null;
  url?: string | null;
  sortOrder?: number | null;
};

type VoteCandidatesResponse = {
  id?: number | string;
  title?: string;
  items?: VoteCandidateItem[];
};

type VoteCandidatesApiResponse = {
  data?: VoteCandidatesResponse;
};

export async function getVoteCandidates(): Promise<{
  id?: number | string;
  title: string;
  items: { id: string; imageUrl: string }[];
} | null> {
  const res = await authFetch(`${API_BASE_URL}/api/votes/candidates`, {
    method: "GET",
  });

  const raw = await res.text();
  const parsed = raw
    ? ((JSON.parse(raw) as VoteCandidatesApiResponse) ?? {})
    : {};
  const data = parsed.data ?? (parsed as VoteCandidatesResponse);

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("투표 목록을 불러오지 못했습니다.");
  }

  const items = (data.items ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((item) => {
      const rawImage =
        item.imageObjectKey ?? item.accessUrl ?? item.imageUrl ?? item.url;
      const imageUrl = resolveMediaUrl(rawImage ?? undefined);
      return {
        id: String(item.id),
        imageUrl: imageUrl ?? "/images/white.png",
      };
    });

  return {
    id: data.id,
    title: data.title ?? "",
    items,
  };
}
