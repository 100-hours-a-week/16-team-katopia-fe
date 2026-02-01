import { API_BASE_URL } from "@/src/config/api";
import { authFetch } from "@/src/lib/auth";

export type UploadCategory = "PROFILE" | "POST" | "VOTE";

export type PresignFile = {
  uploadUrl: string;
  imageObjectKey: string;
};

type PresignResponse = {
  data?: {
    files?: PresignFile[];
  };
  message?: string;
};

export async function requestUploadPresign(
  category: UploadCategory,
  extensions: string[],
) {
  let res: Response;
  try {
    res = await authFetch(`${API_BASE_URL}/api/uploads/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, extensions }),
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "네트워크 오류로 요청 실패";
    throw new Error(message);
  }

  const raw = await res.text();
  const parsed = raw ? (JSON.parse(raw) as PresignResponse) : null;

  if (!res.ok) {
    const message =
      parsed?.message ?? "업로드 URL 발급에 실패했습니다.";
    throw new Error(`(${res.status}) ${message}`);
  }

  const files = parsed?.data?.files ?? [];
  if (files.length === 0) {
    throw new Error("업로드 URL이 비어 있습니다.");
  }

  return files;
}

export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: Blob,
  contentType?: string,
) {
  const headers: Record<string, string> = {};
  if (contentType) headers["Content-Type"] = contentType;

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers,
    body: file,
  });

  if (!res.ok) {
    throw new Error(`업로드 실패 (${res.status})`);
  }
}
