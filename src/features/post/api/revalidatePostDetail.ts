export async function revalidatePostDetail(postId: string) {
  try {
    await fetch(`/api/revalidate/post/${postId}`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore: ISR revalidate failure should not block UI flow
  }
}
