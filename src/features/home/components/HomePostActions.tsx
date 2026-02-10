"use client";

import Image from "next/image";

type HomePostActionsProps = {
  likeCount: number;
  commentCount: number;
};

type ActionButtonProps = {
  icon: string;
  label: string;
  count: number;
};

function ActionButton({ icon, label, count }: ActionButtonProps) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 text-neutral-900"
      aria-label={label}
    >
      <Image src={icon} alt="" width={22} height={22} />
      <span className="text-[14px] font-semibold">{count}</span>
    </button>
  );
}

function BookmarkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M6 4.5h12a1 1 0 0 1 1 1v15l-7-4-7 4v-15a1 1 0 0 1 1-1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HomePostActions({
  likeCount,
  commentCount,
}: HomePostActionsProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-5">
        <ActionButton icon="/icons/heart.svg" label="좋아요" count={likeCount} />
        <ActionButton
          icon="/icons/comment.svg"
          label="댓글"
          count={commentCount}
        />
      </div>
      <button
        type="button"
        aria-label="저장"
        className="text-neutral-900"
      >
        <BookmarkIcon />
      </button>
    </div>
  );
}
