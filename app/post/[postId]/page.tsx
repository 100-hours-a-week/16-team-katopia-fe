import PostDetailPage from "@/src/features/post/components/PostDetailPage";
import { getPostDetailServer } from "@/src/features/post/api/getPostDetailServer";
import { notFound } from "next/navigation";

export const revalidate = false;
export const dynamic = "force-static";
export const dynamicParams = true;

type Props = {
  params: Promise<{ postId: string }>;
};

export async function generateStaticParams(): Promise<{ postId: string }[]> {
  // 빌드 시점 pre-render 없이, 첫 요청에 생성 후 태그 무효화로 갱신합니다.
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
