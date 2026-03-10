"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

type VoteOnboardingModalProps = {
  open: boolean;
  onStart: () => void;
};

export default function VoteOnboardingModal({
  open,
  onStart,
}: VoteOnboardingModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onStart();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onStart]);

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-70 bg-black/55">
      <div className="mx-auto h-dvh w-full max-w-107.5 px-5">
        <div className="flex h-full items-center justify-center">
          <div className="w-full max-w-[340px] rounded-3xl border border-white/20 bg-[#161616] px-5 py-6 text-white shadow-2xl">
            <h3 className="text-center text-[18px] font-bold">투표 가이드</h3>
            <p className="mt-2 text-center text-[13px] text-white/75">
              카드를 좌로 끌고 손을 떼면 넘기기,
              <br />
              우로 끌고 손을 떼면 좋아요로 투표됩니다.
              <br />
            </p>

            <div className="mt-5 rounded-2xl bg-white/6 px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center">
                  <svg
                    viewBox="0 0 48 20"
                    className="vote-guide-arc-left mb-1 h-5 w-12 text-white/75"
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
                    width={48}
                    height={48}
                    className="vote-guide-hand-left h-12 w-12"
                  />
                  <span className="mt-1 text-[11px] font-semibold text-white/80">
                    좌로 스와이프: 넘기기
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <svg
                    viewBox="0 0 48 20"
                    className="vote-guide-arc-right mb-1 h-5 w-12 text-white/75"
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
                    width={48}
                    height={48}
                    className="vote-guide-hand-right h-12 w-12"
                  />
                  <span className="mt-1 text-[11px] font-semibold text-white/80">
                    우로 스와이프: 좋아요
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onStart}
              className="mt-5 w-full rounded-full border border-white/80 bg-white py-3 text-[14px] font-semibold text-black"
            >
              시작하기
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
