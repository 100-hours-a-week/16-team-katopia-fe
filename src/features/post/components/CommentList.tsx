import { useEffect, useRef, useState } from "react";
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
  onDelete: (id: number) => void;
  onUpdate: (id: number, content: string) => void;
  currentUserId?: number | string;
  currentUserNickname?: string;
  onOverLimit?: () => void;
}

const PAGE_SIZE = 10;

export default function CommentList({
  comments,
  onDelete,
  onUpdate,
  currentUserId,
  currentUserNickname,
  onOverLimit,
}: Props) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Comment[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const next = comments.slice(0, page * PAGE_SIZE);
    setItems([...next]);
    setHasMore(next.length < comments.length);
  }, [comments, page]);

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.4 },
    );
    observerRef.current.observe(node);

    return () => observerRef.current?.disconnect();
  }, [hasMore, items.length]);

  return (
    <div className="mt-6 space-y-3">
      {items.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onDelete={onDelete}
          onUpdate={onUpdate}
          currentUserId={currentUserId}
          currentUserNickname={currentUserNickname}
          onOverLimit={onOverLimit}
        />
      ))}
      <div ref={sentinelRef} />
    </div>
  );
}
