// src/features/posts/api/createPost.ts
import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { extractTags } from "@/src/features/post/utils/extractTags";
export async function createPost(data: {
  content: string;
  imageUrls: string[];
}) {
  const res = await authFetch(`${API_BASE_URL}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: data.content,
      imageUrls: data.imageUrls, // 🔥 중요: key 이름 맞추기
      tags: extractTags(data.content),
    }),
  });

  const result = await res.json();
  console.log("createPost response", { status: res.status, result });

  if (!res.ok) {
    throw result; // 에러를 그대로 던짐
  }

  return result;
}
