"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { getPostDetail } from "../api/getPostDetail";
import PostFormLayout from "../PostFormLayout";
import PostFormHeader from "../components/PostFormHeader";
import PostImagePreview from "../components/PostImagePreview";
import PostContentInput from "../create/components/PostContentInput";
import PostCancelConfirmModal from "../create/components/PostCancelConfirmModal";

import { updatePost } from "../api/updatePost";
import { pickImageUrl } from "@/src/features/upload/utils/normalizeImageUrls";

/* ================= schema ================= */

const postEditSchema = z.object({
  content: z
    .string()
    .min(1, "내용을 입력해주세요.")
    .max(500, "최대 500자까지 입력할 수 있습니다."),
});

type PostEditValues = z.infer<typeof postEditSchema>;

type ImageUrlItem = {
  imageObjectKey?: string;
  imageUrl?: string;
  accessUrl?: string;
  url?: string;
  sortOrder?: number;
};

function normalizeImageUrls(
  value: string[] | ImageUrlItem[] | undefined,
): string[] {
  if (!value || value.length === 0) return [];

  if (typeof value[0] === "string") {
    return value as string[];
  }

  const items = value as ImageUrlItem[];
  return [...items]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((img) => pickImageUrl(img))
    .filter(Boolean) as string[];
}

function isApiError(e: unknown): e is { code?: string } {
  return typeof e === "object" && e !== null && "code" in e;
}

/* ================= page ================= */

export default function PostEditPage() {
  const router = useRouter();
  const { postId } = useParams<{ postId: string }>();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<{ id: string; url: string }[]>([]);

  const methods = useForm<PostEditValues>({
    resolver: zodResolver(postEditSchema),
    defaultValues: {
      content: "",
    },
    mode: "onChange",
  });

  const {
    handleSubmit,
    formState: { isDirty, isSubmitting, isValid },
  } = methods;

  useEffect(() => {
    if (!postId) return;

    getPostDetail(postId)
      .then((res) => {
        const data = res.data;
        const urls = normalizeImageUrls(
          (data as { imageObjectKeys?: unknown })?.imageObjectKeys ??
            data?.imageUrls,
        );

        setImages(
          urls.map((url, idx) => ({
            id: `${postId}-${idx}`,
            url,
          })),
        );

        methods.reset({
          content: data?.content ?? "",
        });
      })
      .catch((e) => {
        if (e?.code === "POST-E-005") {
          alert("게시글을 찾을 수 없습니다.");
          router.replace("/");
        }
      })
      .finally(() => setLoading(false));
  }, [postId, router, methods]);

  const onSubmit = async (values: PostEditValues) => {
    if (!postId) return;

    try {
      await updatePost({
        postId,
        content: values.content,
      });

      console.log("게시글이 수정되었습니다.");
      router.replace(`/post/${postId}`);
    } catch (e: unknown) {
      if (!isApiError(e)) {
        alert("알 수 없는 오류가 발생했습니다.");
        return;
      }

      console.log(e.code);

      switch (e.code) {
        case "POST-E-001":
          alert("내용을 입력해주세요.");
          break;
        case "POST-E-002":
          alert("내용은 최대 500자까지 입력할 수 있습니다.");
          break;
        case "AUTH-E-002":
          alert("로그인이 필요합니다.");
          router.replace("/login");
          break;
        case "POST-E-005":
          alert("게시글을 찾을 수 없습니다.");
          router.replace("/");
          break;
        default:
          alert("게시글 수정에 실패했습니다.");
      }
    }
  };

  if (loading) return <div>로딩중...</div>;

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
        <PostImagePreview images={images} />

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
