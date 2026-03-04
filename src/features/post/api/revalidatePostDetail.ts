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

    const res = await fetch(`/revalidate/post/${postId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ scope }),
      keepalive: true,
    });

    if (!res.ok) {
      const payload = await res
        .clone()
        .json()
        .catch(() => null);
      console.warn("[revalidatePostDetail] request failed", {
        postId,
        scope,
        status: res.status,
        payload,
      });
      return false;
    }

    return true;
  } catch {
    // UI flow를 막지는 않되, 원인 추적을 위해 로그를 남깁니다.
    console.warn("[revalidatePostDetail] request error", { postId, scope });
    return false;
  }
}
