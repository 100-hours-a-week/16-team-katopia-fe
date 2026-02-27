"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Avatar from "@/src/shared/components/Avatar";
import {
  getFollowings,
  type FollowingMember,
} from "@/src/features/profile/api/getFollowings";
import {
  getFollowers,
  type FollowerMember,
} from "@/src/features/profile/api/getFollowers";

type FollowTab = "follower" | "following";

const PAGE_SIZE = 20;

export default function ProfileFollowListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab =
    (searchParams.get("tab") as FollowTab | null) ?? "follower";
  const [activeTab, setActiveTab] = useState<FollowTab>(initialTab);

  const nickname = searchParams.get("nickname") ?? "닉네임";
  const memberIdParam = searchParams.get("memberId");
  const memberIdRaw = memberIdParam ? Number(memberIdParam) : Number.NaN;
  const memberId = Number.isNaN(memberIdRaw) ? null : memberIdRaw;
  const followerCount = Number(searchParams.get("followers") ?? "0");
  const followingCount = Number(searchParams.get("following") ?? "0");

  const title = useMemo(() => nickname, [nickname]);

  const [items, setItems] = useState<(FollowingMember | FollowerMember)[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setItems([]);
    setCursor(null);
    setHasMore(false);
    setInitialized(false);
  }, [activeTab, memberIdParam]);

  useEffect(() => {
    if (!memberId) return;
    if (initialized) return;

    const load = async () => {
      setLoading(true);
      try {
        if (activeTab === "following") {
          const data = await getFollowings({
            memberId,
            size: PAGE_SIZE,
          });
          setItems(data.members);
          setCursor(data.nextCursor ?? null);
          setHasMore(Boolean(data.nextCursor));
        } else {
          const data = await getFollowers({
            memberId,
            size: PAGE_SIZE,
          });
          setItems(data.members);
          setCursor(data.nextCursor ?? null);
          setHasMore(Boolean(data.nextCursor));
        }
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    load();
  }, [activeTab, initialized, memberId]);

  useEffect(() => {
    if (!memberId) return;
    if (!hasMore || loading) return;

    let observer: IntersectionObserver | null = null;
    const target = document.getElementById("followings-sentinel");
    if (!target) return;

    observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (loading || !hasMore) return;

        const loadMore = async () => {
          setLoading(true);
          try {
            if (activeTab === "following") {
              const data = await getFollowings({
                memberId,
                cursor,
                size: PAGE_SIZE,
              });
              setItems((prev) => [...prev, ...data.members]);
              setCursor(data.nextCursor ?? null);
              setHasMore(Boolean(data.nextCursor));
            } else {
              const data = await getFollowers({
                memberId,
                cursor,
                size: PAGE_SIZE,
              });
              setItems((prev) => [...prev, ...data.members]);
              setCursor(data.nextCursor ?? null);
              setHasMore(Boolean(data.nextCursor));
            }
          } finally {
            setLoading(false);
          }
        };

        loadMore();
      },
      { rootMargin: "120px" },
    );

    observer.observe(target);
    return () => observer?.disconnect();
  }, [activeTab, cursor, hasMore, loading, memberId]);

  return (
    <div className="min-h-screen bg-white px-4 py-4">
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-0"
        >
          <Image src="/icons/back.svg" alt="뒤로가기" width={20} height={20} />
        </button>
        <p className="text-[13px] font-semibold text-[#121212]">{title}</p>
      </div>

      <div className="mt-6 flex items-center justify-center gap-20 text-center">
        <button
          type="button"
          onClick={() => setActiveTab("follower")}
          className="flex flex-col items-center"
        >
          <p className="text-[12px] font-semibold text-[#121212]">
            {followerCount}
          </p>
          <p
            className={`mt-1 text-[12px] ${
              activeTab === "follower"
                ? "font-semibold text-[#121212] underline underline-offset-6"
                : "text-gray-500"
            }`}
          >
            팔로워
          </p>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("following")}
          className="flex flex-col items-center"
        >
          <p className="text-[13px] font-semibold text-[#121212]">
            {followingCount}
          </p>
          <p
            className={`mt-1 text-[12px] ${
              activeTab === "following"
                ? "font-semibold text-[#121212] underline underline-offset-6"
                : "text-gray-500"
            }`}
          >
            팔로잉
          </p>
        </button>
      </div>

      {activeTab === "following" || activeTab === "follower" ? (
        <>
          {memberId ? (
            <>
              <ul className="mt-8 space-y-6">
                {items.map((item) => (
                  <li key={item.followId} className="flex items-center gap-4">
                    <Avatar
                      src={item.profileImageObjectKey ?? null}
                      alt="profile"
                      size={40}
                      fallbackSrc="/icons/user.svg"
                      fallbackSize={20}
                      className="bg-gray-200"
                    />
                    <p className="text-[12px] font-semibold text-[#121212]">
                      {item.nickname}
                    </p>
                  </li>
                ))}
              </ul>
              {hasMore && <div id="followings-sentinel" className="h-12" />}
              {!loading && items.length === 0 && (
                <p className="mt-10 text-center text-[12px] text-gray-500">
                  {activeTab === "following"
                    ? "아직 팔로잉한 사용자가 없어요."
                    : "아직 팔로워가 없어요."}
                </p>
              )}
            </>
          ) : (
            <p className="mt-10 text-center text-[12px] text-gray-500">
              사용자 정보가 없습니다.
            </p>
          )}
        </>
      ) : (
        <p className="mt-10 text-center text-[12px] text-gray-500">-</p>
      )}
    </div>
  );
}
