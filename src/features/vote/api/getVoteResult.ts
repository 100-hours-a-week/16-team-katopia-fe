import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type VoteResultItem = {
  id: number | string;
  imageObjectKey?: string | null;
  sortOrder?: number | null;
  fitCount?: number | null;
  fitRate?: number | null;
  likeCount?: number | null;
  likePercent?: number | null;
  voteCount?: number | null;
  voteRate?: number | null;
};

export type VoteResultResponse = {
  id?: number | string;
  title?: string;
  items?: VoteResultItem[];
};

type VoteResultApiResponse = {
  data?: VoteResultResponse;
};

export async function getVoteResult(voteId: number | string) {
  const res = await authFetch(`${API_BASE_URL}/api/votes/${voteId}`, {
    method: "GET",
  });

  const raw = await res.text();
  const parsed = raw ? ((JSON.parse(raw) as VoteResultApiResponse) ?? {}) : {};
  const data = parsed.data ?? (parsed as VoteResultResponse);

  if (!res.ok) {
    throw new Error("투표 결과를 불러오지 못했습니다.");
  }

  return data;
}
