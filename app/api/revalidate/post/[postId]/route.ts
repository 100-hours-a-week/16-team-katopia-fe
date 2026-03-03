import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
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

  if (!postId) {
    return errorResponse(
      "POST_ID_MISSING",
      "게시글 ID가 제공되지 않았습니다. 다시 시도해주세요.",
      400,
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
    revalidateTag(getPostDetailTag(postId), "max");
    revalidatePath(`/post/${postId}`);

    if (scope === "delete") {
      // 삭제 시 상세 외에도 목록성 화면이 최신 상태를 보도록 함께 무효화합니다.
      revalidateTag("home-feed", "max");
      revalidatePath("/home");
      revalidatePath("/search");
      revalidatePath("/profile");
    }
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
