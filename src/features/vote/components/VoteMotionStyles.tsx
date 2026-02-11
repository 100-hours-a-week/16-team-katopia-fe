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
      .vote-arrow {
        animation: voteArrow 1.2s ease-in-out infinite;
      }
      .animate-vote-float {
        animation: voteFloat 3s ease-in-out infinite;
      }
    `}</style>
  );
}
