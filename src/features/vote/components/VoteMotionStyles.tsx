"use client";

export default function VoteMotionStyles() {
  return (
    <style jsx global>{`
      @keyframes voteArrow {
        0% {
          transform: translateX(0);
          opacity: 0.7;
        }
        50% {
          transform: translateX(calc(var(--dir) * 6px));
          opacity: 1;
        }
        100% {
          transform: translateX(0);
          opacity: 0.7;
        }
      }
      @keyframes voteFloat {
        0% {
          transform: translateY(0) rotate(-2deg);
        }
        50% {
          transform: translateY(-10px) rotate(2deg);
        }
        100% {
          transform: translateY(0) rotate(-2deg);
        }
      }
      @keyframes voteHintPulse {
        0% {
          opacity: 0.72;
          transform: translateY(0);
        }
        50% {
          opacity: 1;
          transform: translateY(-2px);
        }
        100% {
          opacity: 0.72;
          transform: translateY(0);
        }
      }
      @keyframes voteGuideHandLeft {
        0% {
          transform: translateX(0) rotate(0deg);
        }
        50% {
          transform: translateX(-7px) rotate(-6deg);
        }
        100% {
          transform: translateX(0) rotate(0deg);
        }
      }
      @keyframes voteGuideHandRight {
        0% {
          transform: scaleX(-1) translateX(0) rotate(0deg);
        }
        50% {
          transform: scaleX(-1) translateX(-7px) rotate(-6deg);
        }
        100% {
          transform: scaleX(-1) translateX(0) rotate(0deg);
        }
      }
      @keyframes voteGuideArcPulse {
        0% {
          opacity: 0.45;
        }
        50% {
          opacity: 0.95;
        }
        100% {
          opacity: 0.45;
        }
      }
      .vote-arrow {
        animation: voteArrow 1.2s ease-in-out infinite;
      }
      .animate-vote-float {
        animation: voteFloat 3s ease-in-out infinite;
      }
      .vote-swipe-hint {
        animation: voteHintPulse 1.4s ease-in-out infinite;
      }
      .vote-guide-hand-left {
        transform-origin: center;
        animation: voteGuideHandLeft 1.15s ease-in-out infinite;
      }
      .vote-guide-hand-right {
        transform-origin: center;
        animation: voteGuideHandRight 1.15s ease-in-out infinite;
      }
      .vote-guide-arc-left,
      .vote-guide-arc-right {
        animation: voteGuideArcPulse 1.15s ease-in-out infinite;
      }
    `}</style>
  );
}
