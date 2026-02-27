import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type CreateVotePayload = {
  title: string;
  imageObjectKeys: string[];
};

type CreateVoteResponse = {
  data?: {
    id?: number | string;
    title?: string;
    imageObjectKeys?: string[];
  };
  id?: number | string;
  title?: string;
  imageObjectKeys?: string[];
  message?: string;
};

export async function createVote(payload: CreateVotePayload) {
  const res = await authFetch(`${API_BASE_URL}/api/votes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  const parsed = raw ? (JSON.parse(raw) as CreateVoteResponse) : null;

  if (!res.ok) {
    const message = parsed?.message ?? "투표 생성에 실패했습니다.";
    throw new Error(`(${res.status}) ${message}`);
  }

  const data = parsed?.data ?? parsed ?? null;
  return {
    id: data?.id,
    title: data?.title,
    imageObjectKeys: data?.imageObjectKeys ?? [],
  };
}
