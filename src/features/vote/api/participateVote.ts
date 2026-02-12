import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type ParticipateVoteResponse = {
  id?: number | string;
  title?: string;
  items?: {
    id: number | string;
    imageObjectKey?: string | null;
    sortOrder?: number | null;
    fitCount?: number | null;
    fitRate?: number | null;
  }[];
};

type ParticipateVoteApiResponse = {
  data?: ParticipateVoteResponse;
};

export async function participateVote(
  voteId: number | string,
  voteItemIds: Array<number | string>,
) {
  const payload =
    voteItemIds.length > 0 ? { voteItemIds } : undefined;
  const res = await authFetch(
    `${API_BASE_URL}/api/votes/${voteId}/participations`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    },
  );

  const raw = await res.text();
  const parsed = raw
    ? ((JSON.parse(raw) as ParticipateVoteApiResponse) ?? {})
    : {};
  const data = parsed.data ?? (parsed as ParticipateVoteResponse);

  if (!res.ok) {
    throw new Error("투표 참여에 실패했습니다.");
  }

  return data;
}
