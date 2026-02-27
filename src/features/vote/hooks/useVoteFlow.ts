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
const RESULT_REVEAL_DELAY_MS = 3000;

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
  const [noActiveVote, setNoActiveVote] = useState(false);
  const transitionCommittedRef = useRef(false);
  const pendingAnimatedIndexRef = useRef<number | null>(null);
  const resultRevealTimerRef = useRef<number | null>(null);

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
      transitionCommittedRef.current = false;
      pendingAnimatedIndexRef.current = index;
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
    if (transitionCommittedRef.current) return;
    if (pendingAnimatedIndexRef.current !== index) return;
    transitionCommittedRef.current = true;
    pendingAnimatedIndexRef.current = null;
    setIndex((prevIndex) => Math.min(prevIndex + 1, total));
    setExitDirection("right");
    setIsAnimating(false);
    x.set(0);
  }, [index, isAnimating, total, x]);

  const refreshCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getVoteCandidates();
      console.log("[vote] candidates response", result);
      if (!result) {
        setCards([]);
        setTitle("");
        setVoteId(null);
        setNoActiveVote(true);
      } else {
        setCards(result.items);
        setTitle(result.title);
        setVoteId(result.id ?? null);
        setNoActiveVote(false);
      }
      setIndex(0);
      selectedIdsRef.current = [];
      selectedByIndexRef.current = {};
      setSelectedIds([]);
      setResultItems([]);
      setResultStats([]);
      setShowResult(false);
      setIsAnimating(false);
      setExitDirection("right");
      transitionCommittedRef.current = false;
      pendingAnimatedIndexRef.current = null;
      if (resultRevealTimerRef.current) {
        clearTimeout(resultRevealTimerRef.current);
        resultRevealTimerRef.current = null;
      }
      x.set(0);
      submitAttemptedRef.current = false;
    } catch {
      setCards([]);
      setTitle("");
      setVoteId(null);
      setNoActiveVote(false);
    } finally {
      setLoading(false);
    }
  }, [x]);

  useEffect(() => {
    if (!isFinished || !voteId) {
      if (resultRevealTimerRef.current) {
        clearTimeout(resultRevealTimerRef.current);
        resultRevealTimerRef.current = null;
      }
      setShowResult(false);
      return;
    }
    if (submitting || submitAttemptedRef.current) return;
    if (selectedIdsRef.current.length === 0) {
      submitAttemptedRef.current = true;
      void refreshCandidates();
      return;
    }
    setShowResult(false);
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
          const rawImage =
            (
              item as {
                accessUrl?: string | null;
                imageUrl?: string | null;
                url?: string | null;
              }
            ).accessUrl ??
            (
              item as {
                accessUrl?: string | null;
                imageUrl?: string | null;
                url?: string | null;
              }
            ).imageUrl ??
            (
              item as {
                accessUrl?: string | null;
                imageUrl?: string | null;
                url?: string | null;
              }
            ).url ??
            item.imageObjectKey ??
            null;
          const resolved = resolveMediaUrl(rawImage ?? undefined) ?? "";
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
        setResultItems(
          mappedCards.map((card) => ({
            ...card,
            imageUrl: card.imageUrl || "/images/white.png",
          })),
        );
        setResultStats(mappedStats);
        resultRevealTimerRef.current = window.setTimeout(() => {
          setShowResult(true);
          resultRevealTimerRef.current = null;
        }, RESULT_REVEAL_DELAY_MS);
      })
      .catch(() => {
        setResultItems([]);
        setResultStats([]);
        resultRevealTimerRef.current = window.setTimeout(() => {
          setShowResult(true);
          resultRevealTimerRef.current = null;
        }, RESULT_REVEAL_DELAY_MS);
      })
      .finally(() => {
        setSubmitting(false);
      });
  }, [isFinished, refreshCandidates, submitting, voteId]);

  useEffect(() => {
    return () => {
      if (resultRevealTimerRef.current) {
        clearTimeout(resultRevealTimerRef.current);
        resultRevealTimerRef.current = null;
      }
    };
  }, []);

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
    noActiveVote,
  };
}
