"use client";

import { toast } from "react-toastify";

type ShowProfileTabAddedToastParams = {
  message: string;
  onView: () => void;
};

const BOOKMARK_TOAST_ID = "bookmark-added-toast";
const VOTE_TOAST_ID = "vote-added-toast";
const PENDING_VOTE_TOAST_KEY = "katopia.vote.pendingAddedToast";

function showProfileTabAddedToast(
  toastId: string,
  { message, onView }: ShowProfileTabAddedToastParams,
) {
  toast.dismiss(toastId);

  toast(
    ({ closeToast }) => (
      <div className="flex w-full items-center justify-between gap-4 rounded-[18px] bg-[#111111] px-5 py-4 text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
        <p className="text-[15px] font-medium leading-none whitespace-nowrap">
          {message}
        </p>
        <button
          type="button"
          className="shrink-0 text-[15px] font-semibold text-white"
          onClick={(event) => {
            event.stopPropagation();
            closeToast?.();
            onView();
          }}
        >
          보기
        </button>
      </div>
    ),
    {
      toastId,
      position: "bottom-center",
      autoClose: 3000,
      closeButton: false,
      closeOnClick: false,
      hideProgressBar: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        background: "transparent",
        boxShadow: "none",
        padding: 0,
        marginBottom: "76px",
        width: "min( calc(100vw - 32px), 420px )",
        minHeight: "unset",
      },
    },
  );
}

export function showBookmarkAddedToast({
  onView,
}: Omit<ShowProfileTabAddedToastParams, "message">) {
  showProfileTabAddedToast(BOOKMARK_TOAST_ID, {
    message: "마이 프로필 > 북마크에 추가되었습니다.",
    onView,
  });
}

export function dismissBookmarkAddedToast() {
  toast.dismiss(BOOKMARK_TOAST_ID);
}

export function showVoteAddedToast({
  onView,
}: Omit<ShowProfileTabAddedToastParams, "message">) {
  showProfileTabAddedToast(VOTE_TOAST_ID, {
    message: '마이프로필 > "투표" 에 추가되었습니다.',
    onView,
  });
}

export function markPendingVoteAddedToast() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_VOTE_TOAST_KEY, "1");
}

export function consumePendingVoteAddedToast() {
  if (typeof window === "undefined") return false;
  const shouldShow = window.sessionStorage.getItem(PENDING_VOTE_TOAST_KEY) === "1";
  if (shouldShow) {
    window.sessionStorage.removeItem(PENDING_VOTE_TOAST_KEY);
  }
  return shouldShow;
}
