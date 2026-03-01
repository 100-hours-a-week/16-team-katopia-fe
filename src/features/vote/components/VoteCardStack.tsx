import type { MotionValue } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";

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
}: Props) {
  return (
    <section className="relative mt-10 flex h-[520px] items-center justify-center overflow-hidden">
      <div className="relative h-[460px] w-full max-w-[330px] overflow-hidden [perspective:1400px] [transform-style:preserve-3d]">
        {prev && (
          <div
            className="absolute rounded-[28px]"
            style={{
              transform:
                "translateX(-22%) translateY(8px) rotateY(22deg) translateZ(-120px) scale(0.86)",
              transformOrigin: "center",
              backfaceVisibility: "hidden",
              width: "88%",
              left: "6%",
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
              width: "88%",
              left: "6%",
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
                width: "92%",
                left: "4%",
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
                  <span
                    className="vote-arrow h-10 w-10 text-white"
                    style={
                      {
                        backgroundColor: "currentColor",
                        maskImage: "url('/icons/left.svg')",
                        WebkitMaskImage: "url('/icons/left.svg')",
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat",
                        maskSize: "contain",
                        WebkitMaskSize: "contain",
                        maskPosition: "center",
                        WebkitMaskPosition: "center",
                        "--dir": -1,
                      } as React.CSSProperties
                    }
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-semibold">넘겨요</span>
                </div>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className="vote-arrow h-10 w-10 text-white"
                    style={
                      {
                        backgroundColor: "currentColor",
                        maskImage: "url('/icons/right.svg')",
                        WebkitMaskImage: "url('/icons/right.svg')",
                        maskRepeat: "no-repeat",
                        WebkitMaskRepeat: "no-repeat",
                        maskSize: "contain",
                        WebkitMaskSize: "contain",
                        maskPosition: "center",
                        WebkitMaskPosition: "center",
                        "--dir": 1,
                      } as React.CSSProperties
                    }
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-semibold">어울려요</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
