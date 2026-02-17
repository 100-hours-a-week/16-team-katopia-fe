"use client";

import VoteActions from "./components/VoteActions";
import VoteCardStack from "./components/VoteCardStack";
import VoteHeader from "./components/VoteHeader";
import VoteMotionStyles from "./components/VoteMotionStyles";
import VoteProgress from "./components/VoteProgress";
import VoteResultLoading from "./components/VoteResultLoading";
import VoteResultView from "./components/VoteResultView";
import { useVoteFlow } from "./hooks/useVoteFlow";
import Image from "next/image";

export default function VotePage() {
  const {
    index,
    total,
    active,
    prev,
    next,
    progressLabel,
    isFinished,
    showResult,
    exitDirection,
    isAnimating,
    x,
    rotateY,
    rotateZ,
    scale,
    opacity,
    title,
    loading,
    handleDragEnd,
    handleAnimationComplete,
    refreshCandidates,
    resultItems,
    resultStats,
    noActiveVote,
  } = useVoteFlow();

  const question = title || "어떤 룩이 저에게 더 잘어울릴까요?";
  const progressPercent =
    total > 0 ? (Math.min(index + 1, total) / total) * 100 : 0;

  return (
    <div
      className="min-h-svh bg-black px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-6 text-white"
      style={{
        fontFamily:
          '"NanumSquare", "Pretendard", "Apple SD Gothic Neo", sans-serif',
        background: "#000000",
      }}
    >
      <VoteHeader title="오늘의 투표" />

      {noActiveVote && !loading ? (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 text-center text-white">
          <Image
            src="/icons/circle-alert.svg"
            alt=""
            width={72}
            height={72}
            className="opacity-70 invert"
          />
          <p className="text-[15px] font-semibold">
            현재 투표 가능한 투표가 존재하지 않습니다.
          </p>
        </div>
      ) : isFinished ? (
        showResult ? (
          <VoteResultView
            totalVotes={resultStats.reduce((sum, s) => sum + s.likeCount, 0)}
            items={resultItems.map((item, i) => ({
              imageUrl: item.imageUrl,
              dislikePercent: 0,
              dislikeCount: 0,
              likePercent: resultStats[i]?.likePercent ?? 0,
              likeCount: resultStats[i]?.likeCount ?? 0,
            }))}
            onRefresh={refreshCandidates}
          />
        ) : (
          <VoteResultLoading />
        )
      ) : loading || total === 0 ? (
        <VoteResultLoading />
      ) : (
        <>
          <VoteProgress
            question={question}
            progressLabel={progressLabel}
            percent={progressPercent}
          />
          <VoteCardStack
            prev={prev}
            next={next}
            active={active}
            exitDirection={exitDirection}
            isAnimating={isAnimating}
            x={x}
            rotateY={rotateY}
            rotateZ={rotateZ}
            scale={scale}
            opacity={opacity}
            onDragEnd={handleDragEnd}
            onAnimationComplete={handleAnimationComplete}
          />
          <VoteActions
            disabled={index >= total - 1}
            onRefresh={refreshCandidates}
          />
        </>
      )}

      <VoteMotionStyles />
    </div>
  );
}
