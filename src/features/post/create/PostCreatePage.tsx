"use client";

import { useEffect, useRef, useState } from "react";
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

export default function PostCreatePage() {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { ready, isAuthenticated } = useAuth();

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

  const methods = useForm<PostCreateValues>({
    resolver: zodResolver(postCreateSchema),
    mode: "onChange",
    defaultValues: {
      images: [],
      content: "",
    },
  });

  const {
    handleSubmit,
    watch,
    formState: { isDirty, isSubmitting },
  } = methods;

  const [images, content] = watch(["images", "content"]);
  const canSubmit = (images?.length ?? 0) > 0 && !!content?.trim();

  usePostUnsavedGuard(isDirty);

  const onSubmit = async (data: PostCreateValues) => {
    try {
      console.log("post create submit", data);
      if (data.images.some((key) => key.startsWith("pending:"))) {
        throw new Error("이미지 업로드가 완료되지 않았습니다.");
      }
      const imageObjectKeys = data.images.map((key) =>
        key.replace(/^\/+/, ""),
      );
      const res = await createPost({
        content: data.content,
        imageObjectKeys,
      });

      const postId = res.data.id;
      console.log("게시글이 성공적으로 등록되었어요.");
      console.log(postId);
      setToastMessage("게시글 작성이 완료되었습니다.");
      toastTimerRef.current = setTimeout(() => {
        // router.replace("/home"); 원래는 home으로 가게 하는게 맞음. ver2에서 홈화면 구현하면서 바꿀 예정
        router.replace("/search");
      }, 1200);
    } catch (e) {
      /**
       * 서버 에러 코드별 분기
      //  */
      // const code = e?.code;
      // switch (code) {
      //   case "POST-E-001":
      //     toast.error("본문 내용을 입력해주세요.");
      //     break;
      //   case "POST-E-002":
      //     toast.error("본문은 최대 200자까지 입력할 수 있어요.");
      //     break;
      //   case "POST-E-003":
      //     toast.error("이미지는 최소 1장, 최대 3장까지 등록 가능해요.");
      //     break;
      //   case "POST-E-004":
      //     toast.error("태그는 최소 1개, 최대 20개까지 가능해요.");
      //     break;
      //   case "AUTH-E-002":
      //     toast.error("로그인이 필요합니다.");
      //     router.replace("/login");
      //     break;
      //   default:
      //     toast.error("게시글 등록에 실패했어요.");
      // }
    }
  };

  const onInvalid = (errors: FieldErrors<PostCreateValues>) => {
    console.log("post create invalid", errors);
  };

  return (
    <FormProvider {...methods}>
      <PostFormLayout>
        <PostFormHeader
          title="새 게시물"
          onBack={() => {
            if (isDirty) setShowCancelModal(true);
            else router.back();
          }}
          formId="post-create-form"
          submitDisabled={!canSubmit || isSubmitting}
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
          <div className="fixed bottom-25 left-1/2 z-[100] -translate-x-1/2 px-4">
            <div
              className="min-w-[260px] rounded-full border border-black bg-gray-100 px-8 py-3 text-center text-base font-semibold text-black shadow-lg"
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
