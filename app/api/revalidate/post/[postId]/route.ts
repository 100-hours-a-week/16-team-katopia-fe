import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getPostDetailTag } from "@/src/features/post/api/postDetailCache";

type Props = {
  params: Promise<{ postId: string }>;
};

export async function POST(_: Request, { params }: Props) {
  const { postId } = await params;

  if (!postId) {
    return NextResponse.json(
      { ok: false, message: "postId is required" },
      { status: 400 },
    );
  }

  revalidateTag(getPostDetailTag(postId), "max");
  revalidatePath(`/post/${postId}`);

  return NextResponse.json({ ok: true, revalidatedPostId: postId });
}
