import { useEffect, useRef, useState } from "react";
import { MockComment } from "../data/mockFeed";
import CommentItem from "./CommentItem";

interface Props {
  comments: MockComment[];
  onDelete: (id: number) => void;
  onUpdate: (id: number, content: string) => void;
}

const PAGE_SIZE = 10;

export default function CommentList({ comments, onDelete, onUpdate }: Props) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MockComment[]>([]);
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
        />
      ))}
      <div ref={sentinelRef} />
    </div>
  );
}
