"use client";

import { useCallback, useEffect, useState } from "react";
import VoteActions from "./components/VoteActions";
import VoteCardStack from "./components/VoteCardStack";
import VoteEmptyState from "./components/VoteEmptyState";
import VoteFinalStep from "./components/VoteFinalStep";
import VoteHeader from "./components/VoteHeader";
import VoteMotionStyles from "./components/VoteMotionStyles";
import VoteOnboardingModal from "./components/VoteOnboardingModal";
import VoteProgress from "./components/VoteProgress";
import VoteResultLoading from "./components/VoteResultLoading";
import { useVoteFlow } from "./hooks/useVoteFlow";

const VOTE_ONBOARDING_KEY = "katopia.vote.onboardingSeen";

export default function VotePage() {
  const [onboardingOpen, setOnboardingOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(VOTE_ONBOARDING_KEY) !== "1";
  });
  const [swipeHintVisible, setSwipeHintVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    const seen = window.sessionStorage.getItem("katopia.vote.swipeHintSeen");
    return !seen;
  });
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
  const activeBackgroundImage = active?.imageUrl ?? null;

  useEffect(() => {
    if (!swipeHintVisible || index > 0 || total === 0 || isFinished) return;

    const timeoutId = window.setTimeout(() => {
      setSwipeHintVisible(false);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [index, isFinished, swipeHintVisible, total]);

  const hideSwipeHint = useCallback(() => {
    setSwipeHintVisible(false);
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("katopia.vote.swipeHintSeen", "1");
  }, []);

  const handleDragEndWithHint = useCallback(
    (offsetX: number) => {
      if (Math.abs(offsetX) > 10) {
        hideSwipeHint();
      }
      handleDragEnd(offsetX);
    },
    [handleDragEnd, hideSwipeHint],
  );

  const handleOnboardingStart = useCallback(() => {
    setOnboardingOpen(false);
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VOTE_ONBOARDING_KEY, "1");
  }, []);

  let content: React.ReactNode;
  if (loading) {
    content = <VoteResultLoading />;
  } else if (noActiveVote) {
    content = <VoteEmptyState />;
  } else if (total === 0) {
    content = <VoteResultLoading />;
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
          onDragEnd={handleDragEndWithHint}
          onAnimationComplete={handleAnimationComplete}
          showSwipeHint={!onboardingOpen && swipeHintVisible && index === 0}
        />
        <VoteActions
          disabled={index >= total - 1}
          onRefresh={refreshCandidates}
        />
      </>
    );
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-black text-white">
      {activeBackgroundImage && (
        <div
          className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center opacity-80 blur-2xl transition-[background-image] duration-500"
          style={{ backgroundImage: `url("${activeBackgroundImage}")` }}
          aria-hidden="true"
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.22),rgba(0,0,0,0.35)_64%,rgba(0,0,0,0.48)_100%)]"
        aria-hidden="true"
      />
      <div className="relative z-10 px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-6">
        <VoteHeader title="오늘의 투표" />
        {content}
      </div>
      <VoteOnboardingModal
        open={onboardingOpen}
        onStart={handleOnboardingStart}
      />

      <VoteMotionStyles />
    </div>
  );
}
