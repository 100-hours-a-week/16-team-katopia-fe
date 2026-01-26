import { API_BASE_URL } from "@/src/config/api";
import { getAccessToken } from "@/src/lib/auth";

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

  const token = getAccessToken();
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(
    `${API_BASE_URL}/api/search/users?${searchParams.toString()}`,
    {
      method: "GET",
      headers,
      credentials: "include",
      cache: "no-store",
    },
  );

  console.log(res);

  const result = await res.json();

  console.log(result);

  if (!res.ok) {
    throw result;
  }

  return result.data;
}
