import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { API_BASE_URL } from "@/src/config/api";
import { getPostDetailTag } from "@/src/features/post/api/postDetailCache";

type Props = {
  params: Promise<{ postId: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  const { postId } = await params;
  const serverApiBaseUrl = process.env.API_BASE_URL ?? API_BASE_URL;
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
    revalidateTag(getPostDetailTag(postId), "max");
    revalidatePath(`/post/${postId}`);
    revalidatePath("/post/[postId]", "page");
    console.info("[api/posts/[postId]] revalidated", { postId, scope: "update" });
  } catch (error) {
    // 수정 성공 응답은 보장하고, ISR 문제는 로그로 추적합니다.
    console.warn("[api/posts/[postId]] revalidate failed", { postId, error });
  }

  return new NextResponse(payloadText, {
    status: upstreamRes.status,
    headers: responseHeaders,
  });
}
