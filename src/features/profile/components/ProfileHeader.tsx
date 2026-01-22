"use client";

import Image from "next/image";
import { useRef } from "react";
import ProfileMenu from "./ProfileMenu";

type Props = {
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onLogout: () => void;
  onWithdraw: () => void;
};

export default function ProfileHeader({
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onLogout,
  onWithdraw,
}: Props) {
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="relative flex items-center justify-end px-4 py-3">
      <div className="flex items-center gap-4">
        <button className="text-sm font-medium" onClick={onLogout}>
          로그아웃
        </button>

        <button
          ref={menuButtonRef}
          onClick={(e) => {
            e.stopPropagation();
            onToggleMenu();
          }}
        >
          <Image
            src="/icons/setting.svg"
            alt="setting"
            width={28}
            height={28}
          />
        </button>
      </div>

      <ProfileMenu
        open={menuOpen}
        triggerRef={menuButtonRef}
        onClose={onCloseMenu}
        onEditProfile={() => {
          onCloseMenu();
        }}
        onWithdraw={() => {
          onCloseMenu();
          onWithdraw();
        }}
      />
    </header>
  );
}
