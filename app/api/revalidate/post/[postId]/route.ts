import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getPostDetailTag } from "@/src/features/post/api/postDetailCache";

type Props = {
  params: Promise<{ postId: string }>;
};

type RevalidateBody = {
  scope?: "update" | "delete";
};

export async function POST(request: Request, { params }: Props) {
  const { postId } = await params;

  if (!postId) {
    return NextResponse.json(
      { ok: false, message: "postId is required" },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as RevalidateBody;
  const scope = body.scope ?? "update";

  revalidateTag(getPostDetailTag(postId), "max");
  revalidatePath(`/post/${postId}`);

  if (scope === "delete") {
    // 삭제 시 상세 외에도 목록성 화면이 최신 상태를 보도록 함께 무효화합니다.
    revalidateTag("home-feed", "max");
    revalidatePath("/home");
    revalidatePath("/search");
    revalidatePath("/profile");
  }

  return NextResponse.json({
    ok: true,
    revalidatedPostId: postId,
    scope,
  });
}
