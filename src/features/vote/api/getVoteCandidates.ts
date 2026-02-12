import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";

type VoteCandidateItem = {
  id: number | string;
  imageObjectKey?: string | null;
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

export async function getVoteCandidates() {
  const res = await authFetch(`${API_BASE_URL}/api/votes/candidates`, {
    method: "GET",
  });

  const raw = await res.text();
  const parsed = raw
    ? ((JSON.parse(raw) as VoteCandidatesApiResponse) ?? {})
    : {};
  const data = parsed.data ?? (parsed as VoteCandidatesResponse);

  if (!res.ok) {
    throw new Error("투표 목록을 불러오지 못했습니다.");
  }

  const items = (data.items ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((item) => {
      const imageUrl = resolveMediaUrl(item.imageObjectKey ?? undefined);
      return {
        id: String(item.id),
        imageUrl: imageUrl ?? "",
      };
    })
    .filter((item) => Boolean(item.imageUrl));

  return {
    id: data.id,
    title: data.title ?? "",
    items,
  };
}
