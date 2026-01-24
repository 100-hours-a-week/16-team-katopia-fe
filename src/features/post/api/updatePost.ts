import { API_BASE_URL } from "@/src/config/api";
import { getAccessToken } from "@/src/lib/auth";

type UpdatePostParams = {
  postId: string;
  content: string;
  imageUrls: string[];
};

export async function updatePost({
  postId,
  content,
  imageUrls,
}: UpdatePostParams) {
  const token = getAccessToken();

  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      content, // 🔥 내용만 보냄
      imageUrls,
    }),
  });

  const result = await res.json();

  if (!res.ok) {
    throw result;
  }

  return result;
}
