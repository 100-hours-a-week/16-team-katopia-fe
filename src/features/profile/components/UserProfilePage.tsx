"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { API_BASE_URL } from "@/src/config/api";

interface Props {
  userId: string;
}

type Profile = {
  nickname: string;
  profileImageUrl: string | null;
  gender: "male" | "female" | null;
  height: number | null;
  weight: number | null;
  style: string[];
};

export default function UserProfilePage({ userId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberId = Number(userId);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Number.isNaN(memberId)) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/members/${memberId}`, {
          method: "GET",
        });

        if (!res.ok) {
          throw new Error("프로필 조회 실패");
        }

        const json = await res.json();
        setProfile(json.data.profile);
      } catch (err) {
        console.error(err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [memberId]);

  /* -------------------------
     Loading / Error
  ------------------------- */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        불러오는 중…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        사용자를 찾을 수 없습니다.
      </div>
    );
  }

  const { nickname, profileImageUrl, gender, height, weight } = profile;

  const hasBodyInfo = height !== null || weight !== null;

  /* -------------------------
     Render
  ------------------------- */
  return (
    <div className="min-h-screen px-4 py-4">
      {/* 헤더 */}
      <button
        onClick={() => {
          const q = searchParams.get("q");
          const tab = searchParams.get("tab") ?? "account";
          const qs = new URLSearchParams();
          if (tab) qs.set("tab", tab);
          if (q) qs.set("q", q);
          router.push(`/search?${qs.toString()}`);
        }}
      >
        <Image src="/icons/back.svg" alt="뒤로가기" width={24} height={24} />
      </button>

      {/* 프로필 정보 */}
      <div className="mt-8 flex flex-col items-center">
        <div className="relative h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          <Image
            src={profileImageUrl ?? "/icons/user.svg"}
            alt={nickname}
            fill={!!profileImageUrl}
            width={profileImageUrl ? undefined : 32}
            height={profileImageUrl ? undefined : 32}
            className={profileImageUrl ? "rounded-full object-cover" : ""}
          />
        </div>

        <p className="mt-4 font-semibold">
          {nickname}
          {gender && (
            <span className="ml-1 text-muted-foreground">
              ({gender === "female" ? "WOMAN" : "MAN"})
            </span>
          )}
        </p>

        {hasBodyInfo && (
          <p className="mt-2 text-sm text-muted-foreground">
            {height !== null && <span>{height}cm</span>}
            {height !== null && weight !== null && <span>&nbsp;&nbsp;</span>}
            {weight !== null && <span>{weight}kg</span>}
          </p>
        )}
      </div>

      {/* 게시물 그리드 */}
      {/* TODO: 게시물 API 연결 시 교체 */}
      <div className="mt-10 grid grid-cols-3 gap-2">
        <div className="aspect-3/4 bg-muted" />
        <div className="aspect-3/4 bg-muted" />
        <div className="aspect-3/4 bg-muted" />
      </div>
    </div>
  );
}
