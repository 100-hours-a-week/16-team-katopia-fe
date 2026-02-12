import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Comment } from "./CommentList";
import Avatar from "@/src/shared/components/Avatar";

// 여기 수정 시 리렌더링 최소화 하기. 입력할 때 마다 그 Item 부분이 계속 렌더링이 되가지구..

interface Props {
  comment: Comment;
  onDelete: (id: number) => void;
  onUpdate: (id: number, content: string) => void;
  currentUserId?: number | string;
  currentUserNickname?: string;
}

export default function CommentItem({
  comment,
  onDelete,
  onUpdate,
  currentUserId,
  currentUserNickname,
}: Props) {
  const MAX_COMMENT_LENGTH = 200;
  const router = useRouter();
  const avatarColors = ["#D9D9D9", "#E3DFFC", "#F8E0E0", "#D9F1FF", "#E8F5E9"];
  const color = avatarColors[comment.id % avatarColors.length] ?? "#D9D9D9";
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const editRef = useRef<HTMLTextAreaElement | null>(null);
  const isMine =
    comment.isMine != null
      ? comment.isMine
      : (comment.authorId != null &&
          currentUserId != null &&
          String(comment.authorId) === String(currentUserId)) ||
        (comment.nickname &&
          currentUserNickname &&
          comment.nickname === currentUserNickname);

  const handleStartEdit = () => {
    setDraft(comment.content);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDraft(comment.content);
  };

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onUpdate(comment.id, trimmed);
    setIsEditing(false);
  };

  useEffect(() => {
    if (!isEditing) return;
    const el = editRef.current;
    if (!el) return;
    const computed = window.getComputedStyle(el);
    const lineHeight = Number.parseFloat(computed.lineHeight || "0");
    const paddingTop = Number.parseFloat(computed.paddingTop || "0");
    const paddingBottom = Number.parseFloat(computed.paddingBottom || "0");
    const maxHeight = lineHeight
      ? lineHeight * 5 + paddingTop + paddingBottom
      : undefined;
    el.style.height = "auto";
    const nextHeight = el.scrollHeight;
    if (maxHeight && nextHeight > maxHeight) {
      el.style.height = `${maxHeight}px`;
      el.style.overflowY = "auto";
    } else {
      el.style.height = `${nextHeight}px`;
      el.style.overflowY = "hidden";
    }
  }, [draft, isEditing]);

  const handleProfileClick = () => {
    if (comment.authorId == null) return;
    router.push(`/profile/${comment.authorId}`);
  };

  // console.log(comment.authorId);

  return (
    <div className="rounded-4xl bg-[#f9fafb] p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleProfileClick}
          className="flex items-center justify-center"
          aria-label={`${comment.nickname} 프로필 보기`}
        >
          <Avatar
            src={comment.profileImageUrl}
            alt={comment.nickname}
            size={32}
            fallbackSrc="/icons/user.svg"
            fallbackSize={18}
            style={{ backgroundColor: color }}
          />
        </button>
        <span className="text-[13px] font-medium">{comment.nickname}</span>
      </div>

      {isEditing ? (
        <div className="mt-0 pl-10">
          <textarea
            className="w-full resize-none rounded border px-3 py-2 text-[12px] outline-none"
            value={draft}
            onChange={(event) => {
              const next = event.target.value;
              if (next.length <= MAX_COMMENT_LENGTH) {
                setDraft(next);
                return;
              }
              setDraft(next.slice(0, MAX_COMMENT_LENGTH));
            }}
            rows={1}
            ref={editRef}
          />
        </div>
      ) : (
        <p className="mt-0 wrap-break-word whitespace-pre-line pl-10 text-[12px]">
          {comment.content}
        </p>
      )}

      {isMine && (
        <div className="mt-2 flex gap-4 pl-10 text-xs text-muted-foreground">
          {isEditing ? (
            <>
              <button type="button" onClick={handleCancel}>
                취소
              </button>
              <button type="button" onClick={handleSave}>
                완료
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={handleStartEdit}>
                수정
              </button>
              <button type="button" onClick={() => onDelete(comment.id)}>
                삭제
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
