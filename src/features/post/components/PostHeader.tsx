"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";

type Author = {
  id?: number | null;
  nickname: string;
  profileImageUrl?: string | null;
  gender?: "M" | "F" | null;
  height?: number | null;
  weight?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
};

type PostHeaderProps = {
  author: Author;
  createdAt: string;
  isMine?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function PostHeader({
  author,
  createdAt,
  isMine = false,
  onEdit,
  onDelete,
}: PostHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedMenu = menuRef.current?.contains(target);
      const clickedTrigger = triggerRef.current?.contains(target);

      if (!clickedMenu && !clickedTrigger) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const formatDateTime = (value: string) => {
    const date = new Date(value.endsWith("Z") ? value : `${value}Z`);
    if (Number.isNaN(date.getTime())) return "";

    const formatter = new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const map = new Map(parts.map((p) => [p.type, p.value]));

    return `${map.get("year")}.${map.get("month")}.${map.get("day")} ${map.get("hour")}:${map.get("minute")}`;
  };

  const handleProfileClick = () => {
    if (author.id != null) {
      router.push(`/profile/${author.id}`);
    }
  };

  return (
    <div className="mb-4">
      {/* 상단 */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()}>
          <Image src="/icons/back.svg" alt="뒤로가기" width={24} height={24} />
        </button>
        {isMine ? (
          <div className="relative">
            <button
              ref={triggerRef}
              aria-label="더보기"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <Image
                src="/icons/more.svg"
                alt="더보기"
                width={24}
                height={24}
              />
            </button>
            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-7 z-50 w-23 overflow-hidden rounded-md border-2 border-black bg-white text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit?.();
                  }}
                  className="w-full px-3 py-2 text-center hover:bg-gray-100"
                >
                  수정
                </button>
                <div className="h-px bg-black" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.();
                  }}
                  className="w-full px-3 py-2 text-center hover:bg-gray-100"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        ) : (
          <span aria-hidden className="w-5" />
        )}
      </div>

      {/* 작성자 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleProfileClick}
          className="h-10 w-10 rounded-full overflow-hidden bg-muted flex items-center justify-center"
          aria-label={`${author.nickname} 프로필 보기`}
        >
          {resolveMediaUrl(author.profileImageUrl) ? (
            <Image
              src={resolveMediaUrl(author.profileImageUrl) as string}
              alt={author.nickname}
              width={40}
              height={40}
              className="object-cover"
            />
          ) : (
            <Image src="/icons/user.svg" alt="유저" width={20} height={20} />
          )}
        </button>

        <div className="flex-1">
          <p className="text-sm font-semibold">{author.nickname}</p>
          {(author.height || 0) > 0 || (author.weight || 0) > 0 ? (
            <p className="text-xs text-muted-foreground">
              {(author.height || 0) > 0 ? `${author.height}cm` : ""}
              {(author.height || 0) > 0 && (author.weight || 0) > 0
                ? " · "
                : ""}
              {(author.weight || 0) > 0 ? `${author.weight}kg` : ""}
            </p>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          {formatDateTime(createdAt)}
        </p>
      </div>
    </div>
  );
}
