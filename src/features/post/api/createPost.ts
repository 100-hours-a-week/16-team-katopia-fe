// src/features/posts/api/createPost.ts
import { API_BASE_URL } from "@/src/config/api";
import { getAccessToken } from "@/src/lib/auth";
import { PostCreateValues } from "../create/schemas";

export async function createPost(data: PostCreateValues) {
  const token = getAccessToken();

  const res = await fetch(`${API_BASE_URL}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      content: data.content,
      imageUrls: data.images, // 🔥 중요: key 이름 맞추기
    }),
  });

  const result = await res.json();
  console.log("createPost response", { status: res.status, result });

  if (!res.ok) {
    throw result; // 에러를 그대로 던짐
  }

  return result;
}
