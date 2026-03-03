export async function revalidatePostDetail(postId: string) {
  try {
    await fetch("/revalidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: `/post/${postId}`,
      }),
    });
  } catch {
    // ignore: ISR revalidate failure should not block UI flow
  }
}
