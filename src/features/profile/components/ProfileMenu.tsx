"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  triggerRef?: React.RefObject<HTMLElement | null>; // ✅ 여기 수정
  onClose: () => void;
  onEditProfile: () => void;
  onWithdraw: () => void;
};

export default function ProfileMenu({
  open,
  triggerRef,
  onClose,
  onEditProfile,
  onWithdraw,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedMenu = ref.current?.contains(target);
      const clickedTrigger = triggerRef?.current?.contains(target); // ✅ 안전

      if (!clickedMenu && !clickedTrigger) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-4 top-14 w-27 overflow-hidden rounded-md border-2 border-black bg-white text-sm z-50"
    >
      <button
        onClick={() => {
          onEditProfile();
          router.push("/profile/edit");
        }}
        className="w-full px-4 py-3 text-center hover:bg-gray-100"
      >
        프로필 수정
      </button>

      <div className="h-px bg-black" />

      <button
        onClick={onWithdraw}
        className="w-full px-4 py-3 text-center hover:bg-gray-100"
      >
        회원 탈퇴
      </button>
    </div>
  );
}
