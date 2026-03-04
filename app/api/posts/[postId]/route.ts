import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { API_BASE_URL } from "@/src/config/api";
import { getPostDetailTag } from "@/src/features/post/api/postDetailCache";

type Props = {
  params: Promise<{ postId: string }>;
};

const CONSISTENCY_ATTEMPTS = 2;
const CONSISTENCY_DELAY_MS = 80;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDetailReadiness(options: {
  detailUrl: string;
  authorization: string | null;
}) {
  const { detailUrl, authorization } = options;

  for (let attempt = 1; attempt <= CONSISTENCY_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(detailUrl, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          ...(authorization ? { Authorization: authorization } : {}),
        },
      });

      if (res.ok) {
        return { ok: true, attempts: attempt };
      }
    } catch {
      // 다음 재시도에서 복구 시도
    }

    if (attempt < CONSISTENCY_ATTEMPTS) {
      await sleep(CONSISTENCY_DELAY_MS);
    }
  }

  return { ok: false, attempts: CONSISTENCY_ATTEMPTS };
}

export async function PATCH(request: Request, { params }: Props) {
  const { postId } = await params;
  const serverApiBaseUrl = process.env.API_BASE_URL ?? API_BASE_URL;
  const detailUrl = `${serverApiBaseUrl}/api/posts/${postId}`;
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type") ?? "application/json";
  const bodyText = await request.text();

  if (!postId) {
    return NextResponse.json(
      { code: "POST_ID_MISSING", message: "게시글 ID가 필요합니다." },
      { status: 400 },
    );
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(`${serverApiBaseUrl}/api/posts/${postId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": contentType,
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: bodyText,
    });
  } catch (error) {
    console.error("[api/posts/[postId]] upstream patch failed", {
      postId,
      error,
    });
    return NextResponse.json(
      { code: "UPSTREAM_FETCH_FAILED", message: "게시글 수정 요청에 실패했습니다." },
      { status: 502 },
    );
  }

  const payloadText = await upstreamRes.text();
  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", "application/json; charset=utf-8");

  if (!upstreamRes.ok) {
    return new NextResponse(payloadText, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  }

  try {
    const consistency = await waitForDetailReadiness({
      detailUrl,
      authorization,
    });
    revalidateTag(getPostDetailTag(postId), { expire: 0 });
    revalidatePath(`/post/${postId}`);
    revalidatePath("/post/[postId]", "page");
    console.info("[api/posts/[postId]] revalidated", {
      postId,
      scope: "update",
      consistency,
    });
  } catch (error) {
    console.warn("[api/posts/[postId]] revalidate failed", { postId, error });
  }

  return new NextResponse(payloadText, {
    status: upstreamRes.status,
    headers: responseHeaders,
  });
}
