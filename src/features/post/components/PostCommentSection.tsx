"use client";

import CommentInput from "./CommentInput";
import CommentList from "./CommentList";
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
  const { comments, handleCreateComment, handleUpdateComment, handleDeleteComment } =
    usePostComments(postId, {
      id: currentUserId,
      nickname: currentUserNickname,
      profileImageUrl: currentUserProfileImageUrl,
    });

  return (
    <div className="mt-8 border-t pt-6">
      <CommentInput onSubmit={handleCreateComment} />
      <CommentList
        comments={comments}
        onDelete={handleDeleteComment}
        onUpdate={handleUpdateComment}
        currentUserId={currentUserId}
        currentUserNickname={currentUserNickname}
      />
    </div>
  );
}
