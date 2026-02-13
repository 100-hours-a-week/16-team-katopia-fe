"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMotionValue, useTransform } from "framer-motion";
import { getVoteCandidates } from "../api/getVoteCandidates";
import { participateVote } from "../api/participateVote";
import { getVoteResult } from "../api/getVoteResult";
import { resolveMediaUrl } from "@/src/features/profile/utils/resolveMediaUrl";

type VoteCard = {
  id: string;
  imageUrl: string;
};

const THRESHOLD = 120;

export function useVoteFlow() {
  const [cards, setCards] = useState<VoteCard[]>([]);
  const [title, setTitle] = useState("");
  const [voteId, setVoteId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
  const selectedIdsRef = useRef<Array<number | string>>([]);
  const selectedByIndexRef = useRef<Record<number, number | string>>({});
  const [resultItems, setResultItems] = useState<VoteCard[]>([]);
  const [resultStats, setResultStats] = useState<
    { likeCount: number; likePercent: number }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const submitAttemptedRef = useRef(false);

  const total = cards.length;
  const active = cards[index];
  const prev = cards[index - 1];
  const next = cards[index + 1];
  const isFinished = total > 0 && index >= total;

  const x = useMotionValue(0);
  const rotateY = useTransform(x, [-200, 0, 200], [-40, 0, 40]);
  const rotateZ = useTransform(x, [-200, 0, 200], [-14, 0, 14]);
  const scale = useTransform(x, [-220, 0, 220], [0.94, 1, 0.94]);
  const opacity = useTransform(
    x,
    [-260, -140, 0, 140, 260],
    [0.25, 1, 1, 1, 0.25],
  );

  const progressLabel = useMemo(
    () => `${Math.min(index + 1, total)}/${total}`,
    [index, total],
  );

  const addSelection = useCallback((cardIndex: number, id: number | string) => {
    selectedByIndexRef.current[cardIndex] = id;
    const next = Object.keys(selectedByIndexRef.current)
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => selectedByIndexRef.current[Number(key)]);
    selectedIdsRef.current = next;
    setSelectedIds(next);
  }, []);

  const paginate = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating || index >= total) return;
      if (direction === "right" && active) {
        addSelection(index, Number(active.id));
      }
      setExitDirection(direction);
      setIsAnimating(true);
    },
    [active, addSelection, index, isAnimating, total],
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
    if (!isFinished || !voteId) {
      setShowResult(false);
      return;
    }
    if (submitting || submitAttemptedRef.current) return;
    setSubmitting(true);
    submitAttemptedRef.current = true;
    console.log("[vote] participate payload", {
      voteId,
      voteItemIds: selectedIdsRef.current,
    });
    participateVote(voteId, selectedIdsRef.current)
      .then(() => getVoteResult(voteId))
      .then((data) => {
        console.log("[vote] result response", data);
        const items = (data.items ?? []).slice().sort((a, b) => {
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        });
        const mappedCards = items.map((item) => {
          const resolved =
            resolveMediaUrl(item.imageObjectKey ?? undefined) ?? "";
          const isInvalid = resolved.endsWith("/string");
          return {
            id: String(item.id),
            imageUrl: isInvalid ? "/images/white.png" : resolved,
          };
        });
        const mappedStats = items.map((item) => ({
          likeCount: item.fitCount ?? 0,
          likePercent: item.fitRate ?? 0,
        }));
        setResultItems(mappedCards.filter((c) => Boolean(c.imageUrl)));
        setResultStats(mappedStats);
        const timer = window.setTimeout(() => {
          setShowResult(true);
        }, 2000);
        return () => window.clearTimeout(timer);
      })
      .catch(() => {
        setResultItems([]);
        setResultStats([]);
        const timer = window.setTimeout(() => {
          setShowResult(true);
        }, 600);
        return () => window.clearTimeout(timer);
      })
      .finally(() => {
        setSubmitting(false);
      });
  }, [isFinished, submitting, voteId]);

  const refreshCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getVoteCandidates();
      console.log("[vote] candidates response", result);
      setCards(result.items);
      setTitle(result.title);
      setVoteId(result.id ?? null);
      setIndex(0);
      selectedIdsRef.current = [];
      selectedByIndexRef.current = {};
      setSelectedIds([]);
      setResultItems([]);
      setResultStats([]);
      setShowResult(false);
      setIsAnimating(false);
      setExitDirection("right");
      x.set(0);
      submitAttemptedRef.current = false;
    } catch {
      setCards([]);
      setTitle("");
      setVoteId(null);
    } finally {
      setLoading(false);
    }
  }, [x]);

  useEffect(() => {
    refreshCandidates();
  }, [refreshCandidates]);

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
    refreshCandidates,
    selectedIds,
    setSelectedIds,
    addSelection,
    resultItems,
    resultStats,
  };
}
