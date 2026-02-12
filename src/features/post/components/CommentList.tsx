import { useEffect, useRef } from "react";
import CommentItem from "./CommentItem";

export type Comment = {
  id: number;
  nickname: string;
  content: string;
  createdAt?: string;
  isMine?: boolean;
  authorId?: number | string;
  profileImageUrl?: string | null;
};

interface Props {
  comments: Comment[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, content: string) => void;
  currentUserId?: number | string;
  currentUserNickname?: string;
}

export default function CommentList({
  comments,
  loading,
  hasMore,
  onLoadMore,
  onDelete,
  onUpdate,
  currentUserId,
  currentUserNickname,
}: Props) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;
    if (loading) return;
    const node = sentinelRef.current;
    if (!node) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.1 },
    );
    observerRef.current.observe(node);

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return (
    <div className="mt-6 space-y-3">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onDelete={onDelete}
          onUpdate={onUpdate}
          currentUserId={currentUserId}
          currentUserNickname={currentUserNickname}
        />
      ))}
      {hasMore && <div ref={sentinelRef} className="h-24" />}
    </div>
  );
}
