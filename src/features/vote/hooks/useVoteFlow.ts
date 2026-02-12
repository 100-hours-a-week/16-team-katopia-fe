"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMotionValue, useTransform } from "framer-motion";
import { getVoteCandidates } from "../api/getVoteCandidates";

type VoteCard = {
  id: string;
  imageUrl: string;
};

const THRESHOLD = 120;

export function useVoteFlow() {
  const [cards, setCards] = useState<VoteCard[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const total = cards.length;
  const active = cards[index];
  const prev = cards[index - 1];
  const next = cards[index + 1];
  const isFinished = total > 0 && index >= total;

  const x = useMotionValue(0);
  const rotateY = useTransform(x, [-200, 0, 200], [-40, 0, 40]);
  const rotateZ = useTransform(x, [-200, 0, 200], [-14, 0, 14]);
  const scale = useTransform(x, [-220, 0, 220], [0.94, 1, 0.94]);
  const opacity = useTransform(x, [-260, -140, 0, 140, 260], [0.25, 1, 1, 1, 0.25]);

  const progressLabel = useMemo(
    () => `${Math.min(index + 1, total)}/${total}`,
    [index, total],
  );

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

  useEffect(() => {
    let cancelled = false;
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        const result = await getVoteCandidates();
        if (cancelled) return;
        setCards(result.items);
        setTitle(result.title);
        setIndex(0);
      } catch {
        if (cancelled) return;
        setCards([]);
        setTitle("");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCandidates();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    cards,
    title,
    loading,
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
