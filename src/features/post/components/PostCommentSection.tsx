"use client";

import CommentInput from "./CommentInput";
import CommentList from "./CommentList";
import { useCommentCount } from "../hooks/useCommentCountStore";
import { usePostComments } from "../hooks/usePostComments";

type Props = {
  postId?: string;
  currentUserId?: number | string;
  currentUserNickname?: string;
  currentUserProfileImageUrl?: string | null;
};

export default function PostCommentSection({
  postId,
  currentUserId,
  currentUserNickname,
  currentUserProfileImageUrl,
}: Props) {
  const { increment } = useCommentCount();
  const {
    comments,
    loading,
    hasMore,
    loadMore,
    handleCreateComment,
    handleUpdateComment,
    handleDeleteComment,
  } = usePostComments(
    postId,
    {
      id: currentUserId,
      nickname: currentUserNickname,
      profileImageUrl: currentUserProfileImageUrl,
    },
    {
      onCountChange: increment,
    },
  );

  return (
    <div className="mt-8 border-t pt-6">
      <CommentInput onSubmit={handleCreateComment} />
      <CommentList
        comments={comments}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onDelete={handleDeleteComment}
        onUpdate={handleUpdateComment}
        currentUserId={currentUserId}
        currentUserNickname={currentUserNickname}
      />
    </div>
  );
}
