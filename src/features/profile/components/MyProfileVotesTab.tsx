"use client";

import Image from "next/image";
import Link from "next/link";

type VoteItem = {
  id: number | string | null;
  title?: string | null;
  isClosed?: boolean | null;
};

type Props = {
  votes: VoteItem[];
  loading: boolean;
  hasMore: boolean;
  observe: (node: HTMLDivElement | null) => void;
  voteMenuOpenId: number | string | null;
  onToggleMenu: (id: number | string) => void;
  onDeleteClick: (id: number | string, title: string) => void;
};

export default function MyProfileVotesTab({
  votes,
  loading,
  hasMore,
  observe,
  voteMenuOpenId,
  onToggleMenu,
  onDeleteClick,
}: Props) {
  return (
    <>
      <div className="px-5 pb-10 pt-6">
        {votes.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-400">
            아직 작성한 투표가 없어요.
          </div>
        ) : (
          <ul className="space-y-4">
            {votes
              .filter((vote) => vote.id != null)
              .sort((a, b) => Number(Boolean(a.isClosed)) - Number(Boolean(b.isClosed)))
              .map((vote) => (
                <li key={vote.id} className="relative">
                  <Link
                    href={`/vote/${String(vote.id)}`}
                    prefetch
                    className={`flex w-full items-center justify-between rounded-4xl px-6 py-5 text-left text-[12px] font-medium ${
                      vote.isClosed
                        ? "bg-[#121212]/60 text-white/60"
                        : "bg-[#121212] text-white"
                    }`}
                    aria-label={`${vote.title ?? ""} 더보기`}
                  >
                    <span className="truncate">{vote.title}</span>
                    <span className="relative">
                      <button
                        type="button"
                        aria-label="투표 메뉴"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (vote.id == null) return;
                          onToggleMenu(vote.id);
                        }}
                      >
                        <Image
                          src="/icons/vertical.svg"
                          alt=""
                          width={18}
                          height={18}
                          className="invert"
                        />
                      </button>
                      {voteMenuOpenId === vote.id && (
                        <div className="absolute -right-10 top-[calc(100%+8px)] z-10">
                          <button
                            type="button"
                            className="inline-flex min-w-17.5 items-center justify-center gap-2 rounded-full border border-[#ff3b30] bg-white px-2 py-2 text-[12px] font-semibold leading-none text-[#ff3b30] transition-colors hover:bg-[#ffefee]"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (vote.id == null) return;
                              onDeleteClick(vote.id, vote.title ?? "");
                            }}
                          >
                            <Image
                              src="/icons/trash.svg"
                              alt=""
                              width={18}
                              height={18}
                            />
                            삭제
                          </button>
                        </div>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        )}
      </div>
      {hasMore && <div ref={observe} className="h-24" />}
    </>
  );
}
