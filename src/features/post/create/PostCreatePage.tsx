"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { postCreateSchema, PostCreateValues } from "./schemas";
import { usePostUnsavedGuard } from "./hooks/usePostUnsavedGuard";

import PostFormLayout from "../PostFormLayout";
import PostFormHeader from "../components/PostFormHeader";

import PostImageUploader from "./components/PostImageUploader";
import PostContentInput from "./components/PostContentInput";
import PostSubmitButton from "./components/PostSubmitButton";
import PostCancelConfirmModal from "./components/PostCancelConfirmModal";

export default function PostCreatePage() {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);

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
    formState: { isDirty, isSubmitting },
  } = methods;

  usePostUnsavedGuard(isDirty);

  const onSubmit = async (data: PostCreateValues) => {
    try {
      // TODO: POST /api/posts
      const postId = "123"; // 응답값
      router.push(`/post/${postId}`);
    } catch (e) {
      // TODO: 토스트 처리
    }
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
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <PostImageUploader />
          <PostContentInput />
          <PostSubmitButton disabled={isSubmitting} />
        </form>

        <PostCancelConfirmModal
          open={showCancelModal}
          onConfirm={() => router.back()}
          onClose={() => setShowCancelModal(false)}
        />
      </PostFormLayout>
    </FormProvider>
  );
}
