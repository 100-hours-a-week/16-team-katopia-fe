"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import VoteCreateHeader from "./components/VoteCreateHeader";
import VoteCreateTitle from "./components/VoteCreateTitle";
import VoteTitleInput from "./components/VoteTitleInput";
import VoteImagePicker from "./components/VoteImagePicker";
import VoteSubmitButton from "./components/VoteSubmitButton";
import VoteCancelConfirmModal from "./components/VoteCancelConfirmModal";
import type { PreviewItem } from "./hooks/useVoteImageUploader";
import { createVote } from "../api/createVote";

export default function VoteCreatePage() {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const [isTitleValid, setIsTitleValid] = useState(false);
  const [isTitleDirty, setIsTitleDirty] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (!toastMessage) return;
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  }, [toastMessage]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const hasPendingUpload = previews.some((p) =>
    p.objectKey.startsWith("pending:"),
  );
  const canSubmit = isTitleValid && imageCount > 0 && !hasPendingUpload;

  const handleBack = useCallback(() => {
    const isDirty = isTitleDirty || imageCount > 0;
    if (isDirty) {
      setShowCancelModal(true);
      return;
    }
    router.back();
  }, [imageCount, isTitleDirty, router]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    let success = false;

    try {
      if (hasPendingUpload) {
        setToastMessage("이미지 업로드를 완료해주세요.");
        return;
      }

      const titleValue = titleRef.current?.value ?? "";
      const trimmedTitle = titleValue.trim();
      if (!trimmedTitle) {
        setToastMessage("제목을 입력해주세요.");
        return;
      }

      const imageObjectKeys = previews.map((p) =>
        p.objectKey.replace(/^\/+/, ""),
      );

      const result = await createVote({
        title: trimmedTitle,
        imageObjectKeys,
      });

      const voteId = result?.id;
      if (!voteId) {
        throw new Error("투표 ID를 찾을 수 없습니다.");
      }

      success = true;
      router.replace("/vote");
    } catch (error) {
      console.error(error);
      setToastMessage("잠시 후 다시 이용해주세요");
    } finally {
      if (!success) {
        setIsSubmitting(false);
      }
    }
  }, [canSubmit, hasPendingUpload, isSubmitting, previews, router]);

  return (
    <div className="min-h-screen bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-6">
      <VoteCreateHeader onBack={handleBack} />

      <section className="mt-8">
        <VoteCreateTitle />
        <VoteTitleInput
          inputRef={titleRef}
          onValidityChange={setIsTitleValid}
          onDirtyChange={setIsTitleDirty}
        />
        <VoteImagePicker
          onCountChange={setImageCount}
          onPreviewsChange={setPreviews}
        />
      </section>

      <div className="mt-10">
        <VoteSubmitButton
          disabled={!canSubmit || isSubmitting}
          onClick={handleSubmit}
        />
      </div>

      <VoteCancelConfirmModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => router.back()}
      />

      {toastMessage && (
        <div className="fixed bottom-25 left-1/2 z-100 -translate-x-1/2 px-4">
          <div
            className="min-w-65 rounded-full bg-white px-8 py-3 text-center text-base font-semibold text-[#121212] shadow-lg"
            style={{ animation: "toastFadeIn 250ms ease-out forwards" }}
          >
            {toastMessage}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes toastFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
