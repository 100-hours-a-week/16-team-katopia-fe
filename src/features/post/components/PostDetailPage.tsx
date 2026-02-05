"use client";

import { usePostDetail } from "../hooks/usePostDetail";

import PostHeader from "./PostHeader";
import PostDeleteConfirmModal from "./PostDeleteConfirmModal";
import PostImageCarousel from "./PostImageCarousel";
import PostContent from "./PostContent";
import PostCommentSection from "./PostCommentSection";

export default function PostDetailPage() {
  const {
    postId,
    post,
    loading,
    sortedImageUrls,
    effectiveLiked,
    setLikedOverride,
    deleteOpen,
    setDeleteOpen,
    isMine,
    me,
    handleEdit,
    handleDeleteConfirm,
  } = usePostDetail();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen px-4 py-4">
      <PostHeader
        author={post.author}
        createdAt={post.createdAt}
        isMine={isMine}
        onEdit={handleEdit}
        onDelete={() => setDeleteOpen(true)}
      />

      <PostImageCarousel images={sortedImageUrls} />

      <PostContent
        postId={postId ?? ""}
        content={post.content}
        likeCount={post.aggregate.likeCount}
        commentCount={post.aggregate.commentCount}
        isLiked={effectiveLiked}
        onLikedChange={(next) => {
          setLikedOverride(next);
        }}
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
  );
}
