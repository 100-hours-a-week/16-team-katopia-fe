"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { getPostDetail } from "../../api/getPostDetail";
import { updatePost } from "../../api/updatePost";
import { pickImageUrl } from "@/src/features/upload/utils/normalizeImageUrls";

const postEditSchema = z.object({
  content: z
    .string()
    .min(1, "내용을 입력해주세요.")
    .max(200, "최대 200자까지 입력할 수 있습니다."),
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

export function usePostEdit() {
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
    reset,
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

        reset({
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
  }, [postId, reset, router]);

  const submitHandler = useCallback(
    async (values: PostEditValues) => {
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
    },
    [postId, router],
  );

  const onSubmit = useMemo(
    () => handleSubmit(submitHandler),
    [handleSubmit, submitHandler],
  );

  const handleBack = useCallback(() => {
    if (isDirty) setShowCancelModal(true);
    else router.back();
  }, [isDirty, router]);

  return {
    methods,
    images,
    loading,
    showCancelModal,
    setShowCancelModal,
    onSubmit,
    handleBack,
    isSubmitting,
    isValid,
  };
}
