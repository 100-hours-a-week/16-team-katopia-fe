"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMotionValue, useTransform } from "framer-motion";

type VoteCard = {
  id: string;
  imageUrl: string;
};

const CARDS: VoteCard[] = [
  { id: "1", imageUrl: "/images/vote_1.jpeg" },
  { id: "2", imageUrl: "/images/vote_2.jpeg" },
  { id: "3", imageUrl: "/images/vote_3.webp" },
  { id: "4", imageUrl: "/images/vote_4.webp" },
];

const THRESHOLD = 120;

export function useVoteFlow() {
  const [index, setIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const total = CARDS.length;
  const active = CARDS[index];
  const prev = CARDS[index - 1];
  const next = CARDS[index + 1];
  const isFinished = index >= total;

  const x = useMotionValue(0);
  const rotateY = useTransform(x, [-200, 0, 200], [-40, 0, 40]);
  const rotateZ = useTransform(x, [-200, 0, 200], [-14, 0, 14]);
  const scale = useTransform(x, [-220, 0, 220], [0.94, 1, 0.94]);
  const opacity = useTransform(x, [-260, -140, 0, 140, 260], [0.25, 1, 1, 1, 0.25]);

  const progressLabel = useMemo(() => `${Math.min(index + 1, total)}/${total}`, [index, total]);

  const paginate = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating || index >= total) return;
      setExitDirection(direction);
      setIsAnimating(true);
    },
    [index, isAnimating, total],
  );

  const handleDragEnd = useCallback(
    (offsetX: number) => {
      if (Math.abs(offsetX) > THRESHOLD) {
        paginate(offsetX > 0 ? "right" : "left");
        return;
      }
      x.set(0);
    },
    [paginate, x],
  );

  const handleAnimationComplete = useCallback(() => {
    if (!isAnimating) return;
    setIndex((prevIndex) => Math.min(prevIndex + 1, total));
    setExitDirection("right");
    setIsAnimating(false);
    x.set(0);
  }, [isAnimating, total, x]);

  useEffect(() => {
    if (!isFinished) {
      setShowResult(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setShowResult(true);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [isFinished]);

  return {
    cards: CARDS,
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
    paginate,
    handleDragEnd,
    handleAnimationComplete,
  };
}
