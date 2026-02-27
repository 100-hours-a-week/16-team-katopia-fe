"use client";

import { usePostDetail } from "../hooks/usePostDetail";

import PostHeader from "./PostHeader";
import PostDeleteConfirmModal from "./PostDeleteConfirmModal";
import PostImageCarousel from "./PostImageCarousel";
import PostContent from "./PostContent";
import PostCommentSection from "./PostCommentSection";
import {
  CommentCountProvider,
  useCommentCountStore,
} from "../hooks/useCommentCountStore";

export default function PostDetailPage() {
  const {
    postId,
    post,
    loading,
    sortedImageUrls,
    effectiveLiked,
    effectiveBookmarked,
    setLikedOverride,
    setBookmarkedOverride,
    deleteOpen,
    setDeleteOpen,
    isMine,
    me,
    handleEdit,
    handleDeleteConfirm,
  } = usePostDetail();

  const commentCountStore = useCommentCountStore(
    post?.aggregate.commentCount ?? 0,
    postId ?? "unknown",
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

        <PostImageCarousel images={sortedImageUrls} />

        <PostContent
          postId={postId ?? ""}
          content={post.content}
          likeCount={post.aggregate.likeCount}
          isLiked={effectiveLiked}
          isBookmarked={effectiveBookmarked}
          onLikedChange={(next) => {
            setLikedOverride(next);
          }}
          onBookmarkedChange={(next) => {
            setBookmarkedOverride(next);
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
    </CommentCountProvider>
  );
}
