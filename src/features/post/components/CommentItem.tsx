import Image from "next/image";
import { useState } from "react";
import { MockComment } from "../data/mockFeed";

// 여기 수정 시 리렌더링 최소화 하기. 입력할 때 마다 그 Item 부분이 계속 렌더링이 되가지구..

interface Props {
  comment: MockComment;
  onDelete: (id: number) => void;
  onUpdate: (id: number, content: string) => void;
}

export default function CommentItem({ comment, onDelete, onUpdate }: Props) {
  const avatarColors = ["#D9D9D9", "#E3DFFC", "#F8E0E0", "#D9F1FF", "#E8F5E9"];
  const color = avatarColors[comment.id % avatarColors.length] ?? "#D9D9D9";
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);

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

  return (
    <div className="rounded-[20px] bg-[#f9fafb] p-3">
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: color }}
        >
          <Image src="/icons/user.svg" alt="유저" width={18} height={18} />
        </div>
        <span className="text-sm font-medium">{comment.nickname}</span>
      </div>

      {isEditing ? (
        <div className="mt-1 pl-[40px]">
          <input
            className="w-full rounded border px-3 py-2 text-sm outline-none"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
      ) : (
        <p className="mt-1 pl-[40px] text-sm">{comment.content}</p>
      )}

      {comment.isMine && (
        <div className="mt-2 flex gap-4 pl-[40px] text-xs text-muted-foreground">
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
