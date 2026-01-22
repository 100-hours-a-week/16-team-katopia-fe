"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import PostFormLayout from "../PostFormLayout";
import PostFormHeader from "../components/PostFormHeader";
import PostImagePreview from "../components/PostImagePreview";
import PostContentInput from "../create/components/PostContentInput";
import PostCancelConfirmModal from "../create/components/PostCancelConfirmModal";

/* ================= schema ================= */

const postEditSchema = z.object({
  content: z
    .string()
    .min(1, "내용을 입력해주세요.")
    .max(500, "최대 500자까지 입력할 수 있습니다."),
});

type PostEditValues = z.infer<typeof postEditSchema>;

/* ================= mock data ================= */

const MOCK_POST = {
  id: "123",
  content: "기존 게시글 내용입니다.\n이 내용만 수정할 수 있어요.",
  images: [
    {
      id: "img-1",
      url: "/images/logo.png",
    },
    {
      id: "img-2",
      url: "/images/logo.png",
    },
  ],
};

/* ================= page ================= */

export default function PostEditPage() {
  const router = useRouter();
  const { postId } = useParams<{ postId: string }>();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const methods = useForm<PostEditValues>({
    resolver: zodResolver(postEditSchema),
    defaultValues: {
      content: MOCK_POST.content, // ✅ 프리필
    },
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { isDirty, isSubmitting, isValid },
  } = methods;

  const onSubmit = (values: PostEditValues) => {
    console.log("수정된 내용:", values);
    router.push(`/post/${postId}`);
  };

  return (
    <FormProvider {...methods}>
      <PostFormLayout>
        <PostFormHeader
          title="게시글 수정"
          onBack={() => {
            if (isDirty) setShowCancelModal(true);
            else router.back();
          }}
          onSubmit={handleSubmit(onSubmit)}
          submitDisabled={!isValid || isSubmitting}
        />

        {/* 🔒 이미지: 읽기 전용 */}
        <PostImagePreview images={MOCK_POST.images} />

        {/* ✏️ 내용만 수정 가능 */}
        <PostContentInput />

        <PostCancelConfirmModal
          open={showCancelModal}
          onConfirm={() => router.back()}
          onClose={() => setShowCancelModal(false)}
        />
      </PostFormLayout>
    </FormProvider>
  );
}
