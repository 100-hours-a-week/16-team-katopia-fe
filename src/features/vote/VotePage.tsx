"use client";

import VoteActions from "./components/VoteActions";
import VoteCardStack from "./components/VoteCardStack";
import VoteEmptyState from "./components/VoteEmptyState";
import VoteFinalStep from "./components/VoteFinalStep";
import VoteHeader from "./components/VoteHeader";
import VoteMotionStyles from "./components/VoteMotionStyles";
import VoteProgress from "./components/VoteProgress";
import VoteResultLoading from "./components/VoteResultLoading";
import { useVoteFlow } from "./hooks/useVoteFlow";

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

  let content: React.ReactNode;
  if (loading || total === 0) {
    content = <VoteResultLoading />;
  } else if (noActiveVote) {
    content = <VoteEmptyState />;
  } else if (isFinished) {
    content = (
      <VoteFinalStep
        showResult={showResult}
        resultItems={resultItems}
        resultStats={resultStats}
        onRefresh={refreshCandidates}
      />
    );
  } else {
    content = (
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
    );
  }

  return (
    <div className='min-h-svh bg-black px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-6 text-white [font-family:"NanumSquare","Pretendard","Apple_SD_Gothic_Neo",sans-serif]'>
      <VoteHeader title="오늘의 투표" />
      {content}

      <VoteMotionStyles />
    </div>
  );
}
