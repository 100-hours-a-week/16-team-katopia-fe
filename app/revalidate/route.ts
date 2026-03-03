import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

type RevalidateBody = {
  path?: string;
};

function resolvePath(req: NextRequest, body: RevalidateBody | null): string {
  const queryPath = req.nextUrl.searchParams.get("path");
  const bodyPath = body?.path;
  const path = queryPath ?? bodyPath ?? "";

  return path.trim();
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? ((await req.json().catch(() => null)) as RevalidateBody | null)
      : null;

    const path = resolvePath(req, body);

    if (!path) {
      return NextResponse.json(
        { ok: false, message: "Path is required" },
        { status: 400 },
      );
    }

    if (!path.startsWith("/")) {
      return NextResponse.json(
        { ok: false, message: "Path must start with '/'" },
        { status: 400 },
      );
    }

    revalidatePath(path);
    return NextResponse.json({ ok: true, revalidated: true, path });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Revalidation failed" },
      { status: 500 },
    );
  }
}
