import PostDetailPage from "@/src/features/post/components/PostDetailPage";
import { getPostDetailServer } from "@/src/features/post/api/getPostDetailServer";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ postId: string }>;
};

export default async function Page({ params }: Props) {
  const { postId } = await params;
  const post = await getPostDetailServer(postId);

  if (!post) {
    notFound();
  }

  return <PostDetailPage postId={postId} initialPost={post} />;
}
