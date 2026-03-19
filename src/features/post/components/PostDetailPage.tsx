"use client";

import { useState } from "react";
import { usePostDetail } from "../hooks/usePostDetail";
import type { PostDetail } from "../types/postDetail";

import PostHeader from "./PostHeader";
import PostDeleteConfirmModal from "./PostDeleteConfirmModal";
import PostImageCarousel from "./PostImageCarousel";
import PostContent from "./PostContent";
import PostCommentSection from "./PostCommentSection";
import {
  CommentCountProvider,
  useCommentCountStore,
} from "../hooks/useCommentCountStore";

type PostDetailPageProps = {
  postId: string;
  initialPost: PostDetail;
};

export default function PostDetailPage({
  postId,
  initialPost,
}: PostDetailPageProps) {
  const [likeBurstTrigger, setLikeBurstTrigger] = useState(0);
  const {
    post,
    loading,
    sortedImageUrls,
    deleteOpen,
    setDeleteOpen,
    isMine,
    me,
    handleEdit,
    handleDeleteConfirm,
  } = usePostDetail({ postId, initialPost });

  const commentCountStore = useCommentCountStore(
    post?.aggregate.commentCount ?? 0,
    postId,
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <CommentCountProvider value={commentCountStore}>
      <div className="min-h-screen px-2 py-4">
        <PostHeader
          author={post.author}
          createdAt={post.createdAt}
          isMine={isMine}
          onEdit={handleEdit}
          onDelete={() => setDeleteOpen(true)}
        />

        <PostImageCarousel
          images={sortedImageUrls}
          likeBurstTrigger={likeBurstTrigger}
        />

        <PostContent
          key={postId}
          postId={postId}
          content={post.content}
          likeCount={post.aggregate.likeCount}
          isLiked={post.isLiked}
          isBookmarked={post.isBookmarked}
          onLikeBurst={() => setLikeBurstTrigger((prev) => prev + 1)}
        />

        <PostCommentSection
          postId={postId}
          currentUserId={me?.id}
          currentUserNickname={me?.nickname}
          currentUserProfileImageUrl={me?.profileImageUrl}
        />

        <PostDeleteConfirmModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </CommentCountProvider>
  );
}
