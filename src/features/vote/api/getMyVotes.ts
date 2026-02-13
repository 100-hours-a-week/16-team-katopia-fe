import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type VoteListItem = {
  id: number | string;
  title: string;
  isClosed: boolean;
};

type VoteListResponse = {
  votes?: VoteListItem[];
  nextCursor?: string | null;
};

type VoteListApiResponse = {
  data?: VoteListResponse;
};

export async function getMyVotes(params?: {
  cursor?: string | null;
  size?: number;
}) {
  const cursor = params?.cursor ?? null;
  const size = params?.size ?? 20;

  const searchParams = new URLSearchParams();
  if (cursor) searchParams.set("cursor", cursor);
  if (size) searchParams.set("size", String(size));

  const url = `${API_BASE_URL}/api/votes${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const res = await authFetch(url, { method: "GET" });
  const raw = await res.text();
  const parsed = raw ? ((JSON.parse(raw) as VoteListApiResponse) ?? {}) : {};
  const data = parsed.data ?? (parsed as VoteListResponse);

  if (!res.ok) {
    throw new Error("투표 목록을 불러오지 못했습니다.");
  }

  const normalizedVotes = (data.votes ?? [])
    .map((vote) => {
      const raw = vote as VoteListItem & {
        voteId?: number | string;
        vote_id?: number | string;
      };
      const id = raw.id ?? raw.voteId ?? raw.vote_id ?? null;
      return {
        id,
        title: raw.title ?? "",
        isClosed: Boolean(raw.isClosed),
      };
    })
    .filter((vote) => {
      if (vote.id == null) return false;
      const idString = String(vote.id);
      if (idString.trim() === "") return false;
      if (idString === "undefined" || idString === "null") return false;
      return true;
    });

  return {
    votes: normalizedVotes,
    nextCursor: data.nextCursor ?? null,
  };
}
