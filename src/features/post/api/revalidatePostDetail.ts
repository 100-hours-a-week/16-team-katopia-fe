type RevalidateScope = "update" | "delete";

export async function revalidatePostDetail(
  postId: string,
  scope: RevalidateScope = "update",
) {
  try {
    await fetch(`/api/revalidate/post/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope }),
      keepalive: true,
    });
  } catch {
    // ignore: ISR revalidate failure should not block UI flow
  }
}
