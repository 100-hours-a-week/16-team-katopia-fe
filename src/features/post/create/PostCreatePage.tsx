"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { postCreateSchema, PostCreateValues } from "./schemas";
import { usePostUnsavedGuard } from "./hooks/usePostUnsavedGuard";
import { createPost } from "../api/createPost";
import {
  requestUploadPresign,
  uploadToPresignedUrl,
} from "@/src/features/upload/api/presignUpload";
import { getFileExtension } from "@/src/features/upload/utils/getFileExtension";

import PostFormLayout from "../PostFormLayout";
import PostFormHeader from "../components/PostFormHeader";

import PostImageUploader from "./components/PostImageUploader";
import PostContentInput from "./components/PostContentInput";
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
    watch,
    formState: { isDirty, isSubmitting },
  } = methods;

  const [images, content] = watch(["images", "content"]);
  const canSubmit = (images?.length ?? 0) > 0 && !!content?.trim();

  usePostUnsavedGuard(isDirty);

  const onSubmit = async (data: PostCreateValues) => {
    try {
      console.log("post create submit", data);
      const extensions = data.images.map((file) => getFileExtension(file));
      if (extensions.some((ext) => !ext)) {
        throw new Error("지원하지 않는 이미지 확장자입니다.");
      }

      const presignedFiles = await requestUploadPresign("POST", extensions);
      if (presignedFiles.length !== data.images.length) {
        throw new Error("업로드 URL 개수가 올바르지 않습니다.");
      }

      await Promise.all(
        presignedFiles.map((info, index) =>
          uploadToPresignedUrl(
            info.uploadUrl,
            data.images[index],
            data.images[index].type,
          ),
        ),
      );

      const imageUrls = presignedFiles.map((file) => file.accessUrl);
      const res = await createPost({ content: data.content, imageUrls });

      const postId = res.data.id;
      console.log("게시글이 성공적으로 등록되었어요.");
      console.log(postId);
      router.replace("/home");
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
      </PostFormLayout>
    </FormProvider>
  );
}
