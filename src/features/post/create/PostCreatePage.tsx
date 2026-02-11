"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { postCreateSchema, PostCreateValues } from "./schemas";
import { usePostUnsavedGuard } from "./hooks/usePostUnsavedGuard";
import { createPost } from "../api/createPost";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";

import PostFormLayout from "../PostFormLayout";
import PostFormHeader from "../components/PostFormHeader";
import PostImageUploader from "./components/PostImageUploader";
import PostContentInput from "./components/PostContentInput";
import PostCancelConfirmModal from "./components/PostCancelConfirmModal";
import PostSubmitButton from "./components/PostSubmitButton";

export default function PostCreatePage() {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { ready, isAuthenticated } = useAuth();

  /* ---------------- 인증 체크 ---------------- */
  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace("/home");
    }
  }, [isAuthenticated, ready, router]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  /* ---------------- react-hook-form ---------------- */
  const methods = useForm<PostCreateValues>({
    resolver: zodResolver(postCreateSchema),
    mode: "onChange",
    defaultValues: {
      imageObjectKeys: [], // ✅ 수정: images → imageObjectKeys
      content: "",
    },
  });

  const {
    handleSubmit,
    formState: { isDirty },
  } = methods;

  usePostUnsavedGuard(isDirty);

  /* ---------------- submit ---------------- */
  const onSubmit = useCallback(
    async (data: PostCreateValues) => {
      try {
        console.log("post create submit", data);

        // ✅ 수정: pending 상태 체크 대상 통일
        if (data.imageObjectKeys.some((key) => key.startsWith("pending:"))) {
          throw new Error("이미지 업로드가 완료되지 않았습니다.");
        }

        // ✅ 수정: images → imageObjectKeys
        const imageObjectKeys = data.imageObjectKeys.map((key) =>
          key.replace(/^\/+/, ""),
        );

        const res = await createPost({
          content: data.content,
          imageObjectKeys,
        });

        const postId = res.data.id;
        console.log("게시글이 성공적으로 등록되었어요.", postId);

        setToastMessage("게시글 작성이 완료되었습니다.");
        toastTimerRef.current = setTimeout(() => {
          router.replace("/search");
        }, 1200);
      } catch (e) {
        console.error(e);
        // TODO: 에러 코드별 토스트 분기
      }
    },
    [router],
  );

  const onInvalid = useCallback((errors: FieldErrors<PostCreateValues>) => {
    console.log("post create invalid", errors);
  }, []);

  const handleBack = useCallback(() => {
    if (isDirty) setShowCancelModal(true);
    else router.back();
  }, [isDirty, router]);

  /* ---------------- render ---------------- */
  return (
    <FormProvider {...methods}>
      <PostFormLayout>
        <PostFormHeader
          title="새 게시물"
          onBack={handleBack}
          rightSlot={
            <PostSubmitButton
              formId="post-create-form"
              disabled={Boolean(toastMessage)}
            />
          }
        />

        <form
          id="post-create-form"
          onSubmit={handleSubmit(onSubmit, onInvalid)}
        >
          <PostImageUploader />
          <PostContentInput />
        </form>

        <PostCancelConfirmModal
          open={showCancelModal}
          onConfirm={() => router.back()}
          onClose={() => setShowCancelModal(false)}
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
      </PostFormLayout>

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
    </FormProvider>
  );
}
