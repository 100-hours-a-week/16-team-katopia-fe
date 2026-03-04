import PostDetailPage from "@/src/features/post/components/PostDetailPage";
import { getPostDetailServer } from "@/src/features/post/api/getPostDetailServer";
import { notFound } from "next/navigation";

export const revalidate = 3600;
export const dynamic = "force-static";
export const dynamicParams = true;

type Props = {
  params: Promise<{ postId: string }>;
};

export async function generateStaticParams(): Promise<{ postId: string }[]> {
  // 빌드 시점에는 pre-render하지 않고, 첫 요청 시 on-demand로 생성/캐시합니다.
  // 이후에는 revalidate 윈도우 또는 on-demand revalidate에 따라 갱신됩니다.
  return [];
}

export default async function Page({ params }: Props) {
  const { postId } = await params;
  const post = await getPostDetailServer(postId);

  if (!post) {
    notFound();
  }

  return <PostDetailPage postId={postId} initialPost={post} />;
}
