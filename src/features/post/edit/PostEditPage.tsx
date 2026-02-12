"use client";

import { FormProvider } from "react-hook-form";

import PostFormLayout from "../PostFormLayout";
import PostFormHeader from "../components/PostFormHeader";
import PostImagePreview from "../components/PostImagePreview";
import PostContentInput from "../create/components/PostContentInput";
import PostCancelConfirmModal from "../create/components/PostCancelConfirmModal";
import { usePostEdit } from "./hooks/usePostEdit";

export default function PostEditPage() {
  const {
    methods,
    images,
    loading,
    showCancelModal,
    setShowCancelModal,
    onSubmit,
    handleBack,
    isSubmitting,
    isValid,
  } = usePostEdit();

  if (loading) return <div>로딩중...</div>;

  return (
    <FormProvider {...methods}>
      <PostFormLayout>
        <PostFormHeader
          title="게시글 수정"
          onBack={handleBack}
          onSubmit={onSubmit}
          submitDisabled={!isValid || isSubmitting}
        />

        {/* 이미지: 읽기 전용 */}
        <PostImagePreview images={images} />

        {/* 내용만 수정 가능 */}
        <PostContentInput />

        <PostCancelConfirmModal
          open={showCancelModal}
          onConfirm={handleBack}
          onClose={() => setShowCancelModal(false)}
        />
      </PostFormLayout>
    </FormProvider>
  );
}
