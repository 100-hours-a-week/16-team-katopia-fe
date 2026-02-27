import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import type { GetHomePostsResponse } from "@/src/features/home/api/getHomePosts";
import { likePost } from "@/src/features/post/api/likePost";
import { unlikePost } from "@/src/features/post/api/unlikePost";
import { bookmarkPost } from "@/src/features/post/api/bookmarkPost";
import { unbookmarkPost } from "@/src/features/post/api/unbookmarkPost";

type HomeFeedInfiniteData = InfiniteData<GetHomePostsResponse, string | null>;
// 롤백을 위한 쿼리 스냅샷 배열 타입
type HomeFeedQuerySnapshot = Array<
  [QueryKey, HomeFeedInfiniteData | undefined]
>;
// 홈 피드 게시글 한 건 타입
type HomeFeedPost = GetHomePostsResponse["posts"][number];

// 좋아요 토글 뮤테이션 입력 파라미터
type ToggleLikeParams = {
  postId: number;
  // 토글 후 기대되는 좋아요 상태
  nextLiked: boolean;
};

// 북마크 토글 뮤테이션 입력 파라미터
type ToggleBookmarkParams = {
  postId: number;
  // 토글 후 기대되는 북마크 상태
  nextBookmarked: boolean;
};

// home-feed 무한쿼리 캐시에서 특정 postId 항목만 불변 업데이트
function updateHomeFeedPost(
  data: HomeFeedInfiniteData | undefined,
  postId: number,
  updater: (post: HomeFeedPost) => HomeFeedPost,
) {
  if (!data) return data;

  let changed = false;
  // 각 페이지를 순회하며 해당 게시글을 찾고
  const pages = data.pages.map((page) => {
    // 페이지 단위 변경 여부를 추적
    let pageChanged = false;
    // 페이지 내 게시글 목록을 순회
    const posts = (page.posts ?? []).map((post) => {
      if (post.id !== postId) return post;
      pageChanged = true;
      changed = true;

      return updater(post);
    });

    if (!pageChanged) return page;

    return { ...page, posts };
  });

  if (!changed) return data;

  return { ...data, pages };
}

// 좋아요 상태/카운트를 게시글 객체에 반영
function patchLike(post: HomeFeedPost, nextLiked: boolean, likeCount?: number) {
  // 현재 likeCount를 숫자로 정규화
  const currentLikeCount = Number(post.aggregate?.likeCount ?? 0) || 0;
  // 서버값이 있으면 우선 사용하고, 없으면 낙관적 업데이트 값 사용
  const nextLikeCount =
    typeof likeCount === "number"
      ? likeCount
      : Math.max(0, currentLikeCount + (nextLiked ? 1 : -1));

  // 불변 객체로 좋아요 상태와 aggregate.likeCount를 반영
  return {
    ...post,
    isLiked: nextLiked,
    aggregate: {
      ...(post.aggregate ?? {}),
      likeCount: nextLikeCount,
    },
  };
}

// 북마크 상태를 게시글 객체에 반영
function patchBookmark(post: HomeFeedPost, nextBookmarked: boolean) {
  return {
    ...post,
    isBookmarked: nextBookmarked,
  };
}

function showLikeError(nextLiked: boolean, error: { code?: string }) {
  switch (error.code) {
    case "AUTH-E-002":
      alert("로그인이 필요합니다.");
      break;
    case "POST-E-005":
      alert("게시글을 찾을 수 없습니다.");
      break;
    default:
      alert(
        nextLiked ? "좋아요에 실패했습니다." : "좋아요 해제에 실패했습니다.",
      );
  }
}

function showBookmarkError(nextBookmarked: boolean, error: { code?: string }) {
  switch (error.code) {
    case "AUTH-E-002":
      alert("로그인이 필요합니다.");
      break;
    case "POST-E-005":
      alert("게시글을 찾을 수 없습니다.");
      break;
    default:
      alert(
        nextBookmarked
          ? "북마크에 실패했습니다."
          : "북마크 해제에 실패했습니다.",
      );
  }
}

// onMutate에서 저장한 스냅샷으로 캐시를 롤백
function restoreSnapshots(
  queryClient: QueryClient,
  snapshots?: HomeFeedQuerySnapshot,
) {
  if (!snapshots?.length) return;
  // 저장된 각 쿼리 키에 이전 데이터를 복원
  snapshots.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
}

// 홈 피드 게시글 액션(좋아요/북마크) 전용 커스텀 훅
export function useHomeFeedPostActions() {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async ({ postId, nextLiked }: ToggleLikeParams) => {
      try {
        // nextLiked에 따라 like/unlike API를 분기 호출
        const result = nextLiked
          ? await likePost(String(postId))
          : await unlikePost(String(postId));

        return { nextLiked, likeCount: result.likeCount };
      } catch (e: unknown) {
        const error = e as { code?: string; status?: number };
        if (nextLiked && error.status === 409) {
          const result = await unlikePost(String(postId));
          return { nextLiked: false, likeCount: result.likeCount };
        }
        throw error;
      }
    },
    // API 요청 직전에 낙관적 업데이트를 수행
    onMutate: async ({ postId, nextLiked }) => {
      // 동시 fetch로 낙관적 상태가 덮이지 않게 home-feed 쿼리를 취소
      await queryClient.cancelQueries({ queryKey: ["home-feed"] });
      // 실패 시 복원을 위해 현재 home-feed 관련 캐시를 스냅샷으로 저장
      const snapshots = queryClient.getQueriesData<HomeFeedInfiniteData>({
        queryKey: ["home-feed"],
      });

      // 캐시의 대상 게시글에 좋아요 낙관적 업데이트 적용
      queryClient.setQueriesData<HomeFeedInfiniteData>(
        { queryKey: ["home-feed"] },
        (data) =>
          updateHomeFeedPost(data, postId, (post) =>
            patchLike(post, nextLiked),
          ),
      );

      // onError에서 사용할 컨텍스트를 반환
      return { snapshots };
    },
    // 요청 실패 시 스냅샷 롤백 + 사용자 알림을 처리
    onError: (error, variables, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showLikeError(variables.nextLiked, error as { code?: string });
    },
    // 요청 성공 시 서버 likeCount가 오면 캐시에 반영
    onSuccess: (result, variables) => {
      // likeCount가 없으면 onMutate 결과를 유지
      if (typeof result.likeCount !== "number") return;
      queryClient.setQueriesData<HomeFeedInfiniteData>(
        { queryKey: ["home-feed"] },
        (data) =>
          updateHomeFeedPost(data, variables.postId, (post) =>
            patchLike(post, result.nextLiked, result.likeCount),
          ),
      );
    },
    // 최종적으로 무효화해 서버 기준 최신 상태와 정합성을 맞춤
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async ({ postId, nextBookmarked }: ToggleBookmarkParams) => {
      // nextBookmarked에 따라 bookmark/unbookmark API를 분기 호출
      const result = nextBookmarked
        ? await bookmarkPost(String(postId))
        : await unbookmarkPost(String(postId));

      return {
        nextBookmarked:
          typeof result.isBookmarked === "boolean"
            ? result.isBookmarked
            : nextBookmarked,
      };
    },
    onMutate: async ({ postId, nextBookmarked }) => {
      await queryClient.cancelQueries({ queryKey: ["home-feed"] });
      const snapshots = queryClient.getQueriesData<HomeFeedInfiniteData>({
        queryKey: ["home-feed"],
      });

      // 캐시의 대상 게시글에 북마크 낙관적 업데이트 적용
      queryClient.setQueriesData<HomeFeedInfiniteData>(
        { queryKey: ["home-feed"] },
        (data) =>
          updateHomeFeedPost(data, postId, (post) =>
            patchBookmark(post, nextBookmarked),
          ),
      );

      return { snapshots };
    },

    onError: (error, variables, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showBookmarkError(
        variables.nextBookmarked,
        error as { code?: string; status?: number },
      );
    },
    // 요청 성공 시 서버에서 확정된 북마크 상태를 캐시에 반영
    onSuccess: (result, variables) => {
      queryClient.setQueriesData<HomeFeedInfiniteData>(
        { queryKey: ["home-feed"] },
        (data) =>
          updateHomeFeedPost(data, variables.postId, (post) =>
            patchBookmark(post, result.nextBookmarked),
          ),
      );
    },
    // 최종적으로 무효화해 서버 기준 최신 상태와 정합성을 맞춤.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["home-feed"] });
    },
  });

  return {
    toggleLike: (params: ToggleLikeParams) => likeMutation.mutate(params),
    liking: likeMutation.isPending,

    toggleBookmark: (params: ToggleBookmarkParams) =>
      bookmarkMutation.mutate(params),
    bookmarking: bookmarkMutation.isPending,
  };
}
