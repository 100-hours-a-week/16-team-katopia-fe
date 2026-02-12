"use client";

import VoteActions from "./components/VoteActions";
import VoteCardStack from "./components/VoteCardStack";
import VoteHeader from "./components/VoteHeader";
import VoteMotionStyles from "./components/VoteMotionStyles";
import VoteProgress from "./components/VoteProgress";
import VoteResultLoading from "./components/VoteResultLoading";
import VoteResultView from "./components/VoteResultView";
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
    paginate,
    handleDragEnd,
    handleAnimationComplete,
  } = useVoteFlow();

  const question = title || "어떤 룩이 저에게 더 잘어울릴까요?";
  const progressPercent =
    total > 0 ? (Math.min(index + 1, total) / total) * 100 : 0;

  return (
    <div
      className="min-h-svh px-6 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-6 text-white"
      style={{
        fontFamily:
          '"NanumSquare", "Pretendard", "Apple SD Gothic Neo", sans-serif',
        background: isFinished
          ? "#000"
          : "linear-gradient(135deg, #7c3aed 0%, #ec4899 45%, #fb923c 100%)",
      }}
    >
      <VoteHeader title="오늘의 투표" />

      {isFinished ? (
        showResult ? (
          <VoteResultView
            totalVotes={1512}
            items={[
              {
                imageUrl: "/images/vote_1.jpeg",
                dislikePercent: 40,
                dislikeCount: 1234,
                likePercent: 60,
                likeCount: 1734,
              },
              {
                imageUrl: "/images/vote_2.jpeg",
                dislikePercent: 37,
                dislikeCount: 1234,
                likePercent: 63,
                likeCount: 1734,
              },
              {
                imageUrl: "/images/vote_3.webp",
                dislikePercent: 42,
                dislikeCount: 1234,
                likePercent: 58,
                likeCount: 1734,
              },
            ]}
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
            onRefresh={() => paginate("right")}
          />
        </>
      )}

      <VoteMotionStyles />
    </div>
  );
}
