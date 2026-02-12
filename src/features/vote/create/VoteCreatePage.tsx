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
import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";
import { createVote } from "../api/createVote";

export default function VoteCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const titleHelperText = isOverLimit
    ? "최대 20자까지 입력할 수 있어요."
    : null;

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

  const trimEdgeSpaces = useCallback(
    (value: string) => value.replace(/^\s+|\s+$/g, ""),
    [],
  );

  const handleTitleChange = useCallback(
    (next: string) => {
      const normalized = trimEdgeSpaces(next);
      if (normalized.length > 20) {
        setTitle(normalized.slice(0, 20));
        setIsOverLimit(true);
        return;
      }
      setIsOverLimit(false);
      setTitle(normalized);
    },
    [trimEdgeSpaces],
  );

  const isTitleValid = title.length > 0 && !isOverLimit;
  const canSubmit = isTitleValid && imageCount > 0;

  const handleBack = useCallback(() => {
    const isDirty = title.length > 0 || imageCount > 0;
    if (isDirty) {
      setShowCancelModal(true);
      return;
    }
    router.back();
  }, [imageCount, router, title.length]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    let success = false;

    try {
      const extensions = previews.map((item) => {
        const ext = item.internalName.split(".").pop();
        return ext ? ext.toLowerCase() : "jpg";
      });

      const presigned = await requestUploadPresign("VOTE", extensions);
      if (presigned.length !== previews.length) {
        throw new Error("업로드 정보를 불러오지 못했습니다.");
      }

      await Promise.all(
        presigned.map((item, index) =>
          uploadToPresignedUrl(
            item.uploadUrl,
            previews[index].blob,
            previews[index].blob.type || "image/jpeg",
          ),
        ),
      );

      const imageObjectKeys = presigned.map((p) =>
        p.imageObjectKey.replace(/^\/+/, ""),
      );

      const result = await createVote({
        title: title.trim(),
        imageObjectKeys,
      });

      const voteId = result?.data?.id ?? result?.id;
      if (!voteId) {
        throw new Error("투표 ID를 찾을 수 없습니다.");
      }

      success = true;
      router.replace(`/vote/${voteId}`);
    } catch (error) {
      console.error(error);
      setToastMessage("잠시 후 다시 이용해주세요");
    } finally {
      if (!success) {
        setIsSubmitting(false);
      }
    }
  }, [canSubmit, isSubmitting, previews, router, title]);

  return (
    <div className="min-h-screen bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-6">
      <VoteCreateHeader onBack={handleBack} />

      <section className="mt-8">
        <VoteCreateTitle />
        <VoteTitleInput
          value={title}
          onChange={handleTitleChange}
          isOverLimit={isOverLimit}
          helperText={titleHelperText}
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
