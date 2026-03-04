import { getAccessToken, issueAccessToken } from "@/src/lib/auth";

type RevalidateScope = "update" | "delete";

export async function revalidatePostDetail(
  postId: string,
  scope: RevalidateScope = "update",
) {
  try {
    let token = getAccessToken();
    if (!token) {
      token = await issueAccessToken().catch(() => null);
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    await fetch(`/api/revalidate/post/${postId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ scope }),
      keepalive: true,
    });
  } catch {
    // ignore: ISR revalidate failure should not block UI flow
  }
}
