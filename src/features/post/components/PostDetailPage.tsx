"use client";

import { usePostDetail } from "../hooks/usePostDetail";

import PostHeader from "./PostHeader";
import PostDeleteConfirmModal from "./PostDeleteConfirmModal";
import PostImageCarousel from "./PostImageCarousel";
import PostContent from "./PostContent";
import CommentInput from "./CommentInput";
import CommentList from "./CommentList";

export default function PostDetailPage() {
  const {
    postId,
    post,
    comments,
    loading,
    sortedImageUrls,
    effectiveLiked,
    setLikedOverride,
    deleteOpen,
    setDeleteOpen,
    isMine,
    me,
    handleCreateComment,
    handleUpdateComment,
    handleDeleteComment,
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

      <div className="mt-8 border-t pt-6">
        <CommentInput onSubmit={handleCreateComment} />
        <CommentList
          comments={comments}
          onDelete={handleDeleteComment}
          onUpdate={handleUpdateComment}
          currentUserId={me?.id}
          currentUserNickname={me?.nickname}
        />
      </div>

      <PostDeleteConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
