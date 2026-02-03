// src/features/posts/api/createPost.ts
import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";
import { extractTags } from "@/src/features/post/utils/extractTags";
export async function createPost(data: {
  content: string;
  imageObjectKeys: string[];
}) {
  const res = await authFetch(`${API_BASE_URL}/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: data.content,
      imageObjectKeys: data.imageObjectKeys,
      tags: extractTags(data.content),
    }),
  });

  const result = await res.json();
  console.log("createPost payload", {
    content: data.content,
    imageObjectKeys: data.imageObjectKeys,
    tags: extractTags(data.content),
  });
  console.log("createPost response", { status: res.status, result });

  if (!res.ok) {
    throw result; // 에러를 그대로 던짐
  }

  return result;
}
