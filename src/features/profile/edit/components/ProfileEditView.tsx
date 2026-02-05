"use client";

import type { ReactNode } from "react";

type Props = {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  header: ReactNode;
  profileImage: ReactNode;
  nickname: ReactNode;
  gender: ReactNode;
  bodyInfo: ReactNode;
  style: ReactNode;
  toast?: ReactNode;
};

export default function ProfileEditView({
  onSubmit,
  header,
  profileImage,
  nickname,
  gender,
  bodyInfo,
  style,
  toast,
}: Props) {
  return (
    <>
      <form onSubmit={onSubmit} className="min-h-screen bg-white">
        {header}
        {profileImage}
        {nickname}
        {gender}
        {bodyInfo}
        {style}
        {toast}
      </form>

      <style jsx global>{`
        @keyframes toastFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
