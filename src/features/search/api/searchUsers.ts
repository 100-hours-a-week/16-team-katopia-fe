import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type SearchUserItem = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
};

export type SearchUsersResponse = {
  members: SearchUserItem[];
  nextCursor: string | null;
};

export async function searchUsers(params: {
  query: string;
  size?: number;
  after?: string;
  height?: number;
  weight?: number;
  gender?: "M" | "F";
}): Promise<SearchUsersResponse> {
  const searchParams = new URLSearchParams();

  const query = params.query.trim();
  searchParams.set("query", query);
  if (params.size) searchParams.set("size", String(params.size));
  if (params.after) searchParams.set("after", params.after);
  if (params.height) searchParams.set("height", String(params.height));
  if (params.weight) searchParams.set("weight", String(params.weight));
  if (params.gender) searchParams.set("gender", params.gender);

  const res = await authFetch(
    `${API_BASE_URL}/api/search/users?${searchParams.toString()}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
  );

  console.log(res);

  const result = await res.json();

  console.log(result);

  if (!res.ok) {
    if (res.status === 401) {
      return { members: [], nextCursor: null };
    }
    throw result;
  }

  return result.data;
}
