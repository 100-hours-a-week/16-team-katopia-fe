import type { MotionValue } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import VoteSwipeHint from "./VoteSwipeHint";

type Card = {
  id: string;
  imageUrl: string;
};

type Props = {
  prev?: Card;
  next?: Card;
  active?: Card;
  exitDirection: "left" | "right";
  isAnimating: boolean;
  x: MotionValue<number>;
  rotateY: MotionValue<number>;
  rotateZ: MotionValue<number>;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
  onDragEnd: (offsetX: number) => void;
  onAnimationComplete: (completedCardId?: string) => void;
  showSwipeHint?: boolean;
};

export default function VoteCardStack({
  prev,
  next,
  active,
  exitDirection,
  isAnimating,
  x,
  rotateY,
  rotateZ,
  scale,
  opacity,
  onDragEnd,
  onAnimationComplete,
  showSwipeHint = false,
}: Props) {
  return (
    <section className="relative mt-8 flex h-[590px] items-center justify-center overflow-hidden">
      <div className="relative h-[530px] w-full max-w-[370px] overflow-hidden [perspective:1400px] [transform-style:preserve-3d]">
        <VoteSwipeHint visible={showSwipeHint} />
        {prev && (
          <div
            className="absolute rounded-[28px]"
            style={{
              transform:
                "translateX(-22%) translateY(8px) rotateY(22deg) translateZ(-120px) scale(0.86)",
              transformOrigin: "center",
              backfaceVisibility: "hidden",
              width: "90%",
              left: "5%",
              top: 0,
              bottom: 0,
            }}
          >
            <div className="absolute inset-3 overflow-hidden rounded-[22px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prev.imageUrl}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
          </div>
        )}

        {next && (
          <div
            className="absolute rounded-[28px]"
            style={{
              transform:
                "translateX(22%) translateY(8px) rotateY(-22deg) translateZ(-120px) scale(0.86)",
              transformOrigin: "center",
              backfaceVisibility: "hidden",
              width: "90%",
              left: "5%",
              top: 0,
              bottom: 0,
            }}
          >
            <div className="absolute inset-3 overflow-hidden rounded-[22px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={next.imageUrl}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
          </div>
        )}

        <AnimatePresence initial={false} custom={exitDirection}>
          {active && (
            <motion.div
              key={active.id}
              className="absolute rounded-[30px] bg-transparent"
              style={{
                x,
                rotateY,
                rotateZ,
                scale,
                opacity,
                touchAction: "pan-y",
                backfaceVisibility: "hidden",
                width: "96%",
                left: "2%",
                top: 0,
                bottom: 0,
              }}
              drag={isAnimating ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragEnd={(_, info) => onDragEnd(info.offset.x)}
              initial={{ opacity: 0.2, scale: 0.98 }}
              animate={
                isAnimating
                  ? {
                      x: exitDirection === "left" ? -520 : 520,
                      rotateZ: exitDirection === "left" ? -12 : 12,
                      rotateY: exitDirection === "left" ? -22 : 22,
                      opacity: 0,
                      transition: { duration: 0.32, ease: "easeOut" },
                    }
                  : { opacity: 1, scale: 1 }
              }
              onAnimationComplete={
                isAnimating
                  ? (definition) => {
                      // exit animate 객체가 끝났을 때만 상위 상태를 커밋.
                      if (
                        !definition ||
                        typeof definition !== "object" ||
                        !("x" in definition)
                      ) {
                        return;
                      }
                      onAnimationComplete(String(active.id));
                    }
                  : undefined
              }
            >
              <div className="absolute inset-4 overflow-hidden rounded-[22px] bg-transparent select-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={active.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>

              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white">
                <div className="flex flex-col items-center gap-1">
                  <svg
                    viewBox="0 0 48 20"
                    className="vote-guide-arc-left h-4 w-10 text-white/75"
                    aria-hidden="true"
                  >
                    <path
                      d="M42 16 C32 4, 16 4, 6 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M10 7 L4 12 L11 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <Image
                    src="/images/pointer.png"
                    alt=""
                    aria-hidden="true"
                    width={34}
                    height={34}
                    className="vote-guide-hand-left h-8 w-8"
                  />
                  <span className="text-[11px] font-semibold">넘기기</span>
                </div>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white">
                <div className="flex flex-col items-center gap-1">
                  <svg
                    viewBox="0 0 48 20"
                    className="vote-guide-arc-right h-4 w-10 text-white/75"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 16 C16 4, 32 4, 42 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M38 7 L44 12 L37 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <Image
                    src="/images/pointer.png"
                    alt=""
                    aria-hidden="true"
                    width={34}
                    height={34}
                    className="vote-guide-hand-right h-8 w-8"
                  />
                  <span className="text-[11px] font-semibold">좋아요</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
