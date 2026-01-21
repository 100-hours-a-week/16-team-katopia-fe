"use client";

import { useState } from "react";
import { MOCK_FEED } from "../data/mockFeed";
import PostHeader from "./PostHeader";
import PostImageCarousel from "./PostImageCarousel";
import PostContent from "./PostContent";
import CommentInput from "./CommentInput";
import CommentList from "./CommentList";

export default function PostDetailPage() {
  const [comments, setComments] = useState(MOCK_FEED.comments);

  const handleAddComment = (content: string) => {
    setComments((prev) => {
      const maxId = prev.reduce((max, comment) => Math.max(max, comment.id), 0);
      const nextId = maxId + 1;

      return [
        {
          id: nextId,
          nickname: "나",
          content,
          isMine: true,
        },
        ...prev,
      ];
    });
  };

  const handleDeleteComment = (id: number) => {
    setComments((prev) => prev.filter((comment) => comment.id !== id));
  };

  const handleUpdateComment = (id: number, content: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === id ? { ...comment, content } : comment,
      ),
    );
  };

  return (
    <div className="min-h-screen px-4 py-4">
      <PostHeader />
      <PostImageCarousel />
      <PostContent commentCount={comments.length} />
      <div className="mt-8 border-t border-[#e5e5e5] pt-6">
        <CommentInput onSubmit={handleAddComment} />
        <CommentList
          comments={comments}
          onDelete={handleDeleteComment}
          onUpdate={handleUpdateComment}
        />
      </div>
    </div>
  );
}
