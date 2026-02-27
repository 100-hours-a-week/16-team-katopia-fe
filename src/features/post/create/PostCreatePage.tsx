"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { postCreateSchema, PostCreateValues } from "./schemas";
import { usePostUnsavedGuard } from "./hooks/usePostUnsavedGuard";
import { createPost } from "../api/createPost";
import { useAuth } from "@/src/features/auth/providers/AuthProvider";

import PostFormLayout from "../PostFormLayout";
import PostFormHeader from "../components/PostFormHeader";
import PostImageUploaderShell from "./components/PostImageUploaderShell";
import PostContentInput from "./components/PostContentInput";
import PostCancelConfirmModal from "./components/PostCancelConfirmModal";
import PostSubmitButton from "./components/PostSubmitButton";
import { dispatchPostCountChange } from "@/src/features/post/utils/postCountEvents";
import { getPostDetail } from "@/src/features/post/api/getPostDetail";
import type { GetHomePostsResponse } from "@/src/features/home/api/getHomePosts";
import { normalizeImageUrls } from "@/src/features/upload/utils/normalizeImageUrls";

const PostImageUploaderClient = dynamic(
  () => import("./components/PostImageUploaderClient"),
  { ssr: false, loading: () => <PostImageUploaderShell /> },
);

type HomeFeedInfiniteData = InfiniteData<GetHomePostsResponse, string | null>;

function prependHomeFeedPost(
  data: HomeFeedInfiniteData | undefined,
  newPost: GetHomePostsResponse["posts"][number],
) {
  if (!data) return data;
  if (!data.pages.length) return data;

  const exists = data.pages.some((page) =>
    (page.posts ?? []).some((post) => post.id === newPost.id),
  );
  if (exists) return data;

  const pages = data.pages.map((page, index) =>
    index === 0 ? { ...page, posts: [newPost, ...(page.posts ?? [])] } : page,
  );

  return { ...data, pages };
}

function toHomeFeedPost(detail: {
  id?: number | string;
  content?: string;
  tags?: string[];
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt?: string;
  imageObjectKeys?: unknown;
  imageUrls?: unknown;
  author?: {
    memberId?: number | string;
    id?: number | string;
    nickname?: string;
    profileImageObjectKey?: string | null;
    profileImageUrl?: string | null;
    gender?: string | null;
    height?: number | null;
    weight?: number | null;
  };
  aggregate?: {
    likeCount?: number | null;
    commentCount?: number | null;
  };
}): GetHomePostsResponse["posts"][number] | null {
  const id = Number(detail.id);
  if (!Number.isFinite(id) || id <= 0) return null;

  const author = detail.author ?? {};
  const authorId = Number(author.memberId ?? author.id ?? 0);

  return {
    id,
    content: detail.content ?? "",
    tags: detail.tags ?? [],
    isLiked: Boolean(detail.isLiked),
    isBookmarked: Boolean(detail.isBookmarked),
    createdAt: detail.createdAt ?? new Date().toISOString(),
    imageUrls: normalizeImageUrls(detail.imageObjectKeys ?? detail.imageUrls),
    author: {
      id: Number.isFinite(authorId) ? authorId : 0,
      nickname: author.nickname ?? "",
      profileImageObjectKey:
        author.profileImageObjectKey ?? author.profileImageUrl ?? null,
      gender: author.gender ?? null,
      height: author.height ?? null,
      weight: author.weight ?? null,
    },
    aggregate: {
      likeCount: Number(detail.aggregate?.likeCount ?? 0) || 0,
      commentCount: Number(detail.aggregate?.commentCount ?? 0) || 0,
    },
  };
}

export default function PostCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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

        try {
          const detailRes = await getPostDetail(String(postId));
          const newFeedPost = toHomeFeedPost(detailRes?.data ?? {});
          if (newFeedPost) {
            queryClient.setQueriesData<HomeFeedInfiniteData>(
              { queryKey: ["home-feed"] },
              (old) => prependHomeFeedPost(old, newFeedPost),
            );
          }
        } catch {
          // 상세 조회 실패 시에도 홈피드 refetch로 복구
        }
        queryClient.invalidateQueries({ queryKey: ["home-feed"] });

        dispatchPostCountChange(1);
        setToastMessage("게시글 작성이 완료되었습니다.");
        toastTimerRef.current = setTimeout(() => {
          router.replace("/home");
        }, 1200);
      } catch (e) {
        console.error(e);
        // TODO: 에러 코드별 토스트 분기
      }
    },
    [queryClient, router],
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
          <PostImageUploaderClient />
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
              className="min-w-65 rounded-full bg-white px-8 py-3 text-center text-[14px] font-medium text-[#121212] shadow-lg"
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
