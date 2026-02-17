"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import VoteHeader from "./components/VoteHeader";
import VoteResultLoading from "./components/VoteResultLoading";
import VoteResultView from "./components/VoteResultView";
import { getVoteResult, type VoteResultItem } from "./api/getVoteResult";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";

type Props = {
  voteId: number | string;
};

type MappedItem = {
  imageUrl: string;
  likeCount: number;
  likePercent: number;
};

const resultCache = new Map<string | number, MappedItem[]>();

const toNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export default function VoteResultPage({ voteId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MappedItem[]>([]);
  const cacheKey = String(voteId);

  useEffect(() => {
    if (
      voteId == null ||
      voteId === "" ||
      String(voteId) === "undefined" ||
      String(voteId) === "null"
    ) {
      router.replace("/profile?tab=votes");
      return;
    }
    const cached = resultCache.get(cacheKey);
    if (cached && cached.length > 0) {
      setItems(cached);
      setLoading(false);
    }
    let mounted = true;
    const fetchResult = async () => {
      try {
        if (!cached || cached.length === 0) {
          setLoading(true);
        }
        const data = await getVoteResult(voteId);
        const rawItems = (data.items ?? []).slice().sort((a, b) => {
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        });
        const mapped = rawItems
          .map((item: VoteResultItem) => {
            const resolved =
              resolveMediaUrl(item.imageObjectKey ?? undefined) ?? "";
            const isInvalid = resolved.endsWith("/string");
            const likeCount = toNumber(
              item.fitCount ?? item.likeCount ?? item.voteCount ?? 0,
            );
            const likePercent = toNumber(
              item.fitRate ?? item.likePercent ?? item.voteRate ?? 0,
            );
            return {
              imageUrl: isInvalid ? "/images/white.png" : resolved,
              likeCount,
              likePercent,
            };
          })
          .filter((item) => Boolean(item.imageUrl));

        if (!mounted) return;
        setItems(mapped);
        resultCache.set(cacheKey, mapped);
      } catch {
        if (!mounted) return;
        setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchResult();
    return () => {
      mounted = false;
    };
  }, [cacheKey, voteId]);

  const totalVotes = useMemo(
    () => items.reduce((sum, item) => sum + item.likeCount, 0),
    [items],
  );

  const handleRefresh = useCallback(() => {
    router.replace("/vote");
  }, [router]);

  return (
    <div
      className="min-h-svh bg-black px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-6 text-white"
      style={{
        fontFamily:
          '"NanumSquare", "Pretendard", "Apple SD Gothic Neo", sans-serif',
        background: "#000000",
      }}
    >
      <header className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-0"
          aria-label="뒤로가기"
        >
          <Image
            src="/icons/back.svg"
            alt=""
            width={24}
            height={24}
            className="invert"
          />
        </button>
        <VoteHeader title="투표 결과" />
      </header>
      {loading && items.length === 0 ? (
        <VoteResultLoading />
      ) : (
        <div className="relative">
          <VoteResultView
            totalVotes={totalVotes}
            items={items.map((item) => ({
              imageUrl: item.imageUrl,
              dislikePercent: 0,
              dislikeCount: 0,
              likePercent: item.likePercent,
              likeCount: item.likeCount,
            }))}
            onRefresh={handleRefresh}
            showRefresh={false}
            cardWidth={320}
            cardHeight={460}
          />
          {loading && (
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-6">
              <div className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
