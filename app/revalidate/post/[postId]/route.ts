import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { API_BASE_URL } from "@/src/config/api";
import { getPostDetailTag } from "@/src/features/post/api/postDetailCache";

type Props = {
  params: Promise<{ postId: string }>;
};

type RevalidateBody = {
  scope?: "update" | "delete";
};

type RevalidateScope = "update" | "delete";

function errorResponse(
  title: string,
  detail: string,
  status: number,
): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      title,
      detail,
      status,
    },
    { status },
  );
}

export async function POST(request: Request, { params }: Props) {
  const { postId } = await params;
  const serverApiBaseUrl = process.env.API_BASE_URL ?? API_BASE_URL;
  const configuredSecret = process.env.REVALIDATE_SECRET;
  const requestSecret =
    request.headers.get("x-revalidate-secret") ??
    new URL(request.url).searchParams.get("secret");
  const authorization = request.headers.get("authorization");

  if (!postId) {
    return errorResponse(
      "POST_ID_MISSING",
      "게시글 ID가 제공되지 않았습니다. 다시 시도해주세요.",
      400,
    );
  }

  const secretMatched =
    Boolean(configuredSecret) && requestSecret === configuredSecret;
  let authorizedByMember = false;

  if (!secretMatched && authorization) {
    try {
      const meRes = await fetch(`${serverApiBaseUrl}/api/members/me`, {
        method: "GET",
        headers: {
          Authorization: authorization,
        },
      });
      authorizedByMember = meRes.ok;
    } catch {
      authorizedByMember = false;
    }
  }

  if (!secretMatched && !authorizedByMember) {
    return errorResponse(
      "UNAUTHORIZED_REVALIDATE",
      "유효하지 않은 revalidate 요청입니다.",
      401,
    );
  }

  const body = (await request.json().catch(() => ({}))) as RevalidateBody;
  const scope = body.scope ?? "update";

  if (scope !== "update" && scope !== "delete") {
    return errorResponse(
      "INVALID_SCOPE",
      "허용되지 않은 revalidate scope 입니다.",
      400,
    );
  }

  try {
    console.info("[revalidate-post] start", { postId, scope });
    // 상세는 데이터 캐시(tag) + 경로 캐시(path)를 함께 무효화해
    // 즉시성(동적 카운트 반영)과 정합성(페이지 HTML 재생성)을 동시에 보장합니다.
    revalidateTag(getPostDetailTag(postId), { expire: 0 });
    revalidatePath(`/post/${postId}`);
    revalidatePath("/post/[postId]", "page");

    if (scope === "delete") {
      revalidateTag("home-feed", { expire: 0 });
      revalidatePath("/home");
      revalidatePath("/search");
      revalidatePath("/profile");
    }
    console.info("[revalidate-post] success", { postId, scope });
  } catch (error) {
    console.error("[revalidate-post] failed", { postId, scope, error });
    return errorResponse(
      "REVALIDATE_FAILED",
      "캐시 무효화 처리 중 오류가 발생했습니다.",
      500,
    );
  }

  return NextResponse.json({
    ok: true,
    revalidatedPostId: postId,
    scope: scope as RevalidateScope,
  });
}
