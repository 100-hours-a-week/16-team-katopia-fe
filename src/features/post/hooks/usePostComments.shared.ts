"use client";

import type { InfiniteData } from "@tanstack/react-query";
import type { Comment as CommentListItem } from "../components/CommentList";
import type { GetHomePostsResponse } from "@/src/features/home/api/getHomePosts";
import type { CommentItemResponse } from "../api/getComments";

export type CommentItem = CommentListItem;
export type HomeFeedInfiniteData = InfiniteData<
  GetHomePostsResponse,
  string | null
>;

export type CurrentUser = {
  id?: number | string;
  nickname?: string;
  profileImageUrl?: string | null;
};

export type CommentId = string | number;

export type CreateCommentVariables = {
  content: string;
};

export type CreateCommentContext = {
  tempId: string;
  optimistic: CommentItem;
};

export type CommentsPage = {
  comments: CommentItem[];
  nextCursor: number | string | null;
};

export type CommentsInfiniteData = InfiniteData<
  CommentsPage,
  number | string | null
>;

export function dedupeComments(items: CommentItem[]) {
  const seen = new Set<CommentId>();
  const next: CommentItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    next.push(item);
  }
  return next;
}

export function applyHomeFeedCommentCountDelta(
  data: HomeFeedInfiniteData | undefined,
  postId: number,
  delta: number,
) {
  if (!data) return data;
  if (delta === 0) return data;
  let changed = false;

  const pages = data.pages.map((page) => {
    const posts = page.posts ?? [];
    const nextPosts = posts.map((post) => {
      if (post.id !== postId) return post;
      changed = true;
      return {
        ...post,
        aggregate: {
          ...(post.aggregate ?? {}),
          commentCount: Math.max(
            0,
            Number(post.aggregate?.commentCount ?? 0) + delta,
          ),
        },
      };
    });
    return changed ? { ...page, posts: nextPosts } : page;
  });

  if (!changed) return data;
  return { ...data, pages };
}

export function mapComments(items: CommentItemResponse[]): CommentItem[] {
  return items.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    nickname: comment.author.nickname,
    profileImageUrl:
      comment.author.profileImageObjectKey ??
      comment.author.profileImageUrl ??
      null,
    authorId: comment.author.id,
  }));
}

export function normalizeNextCursor(nextCursor?: number | string | null) {
  if (nextCursor === "" || nextCursor == null) return null;
  return nextCursor;
}

export function patchCommentsCache(
  data: CommentsInfiniteData | undefined,
  patcher: (items: CommentItem[]) => CommentItem[],
): CommentsInfiniteData {
  const firstPage = data?.pages[0] ?? { comments: [], nextCursor: null };
  const nextFirstPage: CommentsPage = {
    ...firstPage,
    comments: dedupeComments(patcher(firstPage.comments)),
  };

  if (!data) {
    return {
      pages: [nextFirstPage],
      pageParams: [null],
    };
  }

  return {
    ...data,
    pages: [nextFirstPage, ...data.pages.slice(1)],
  };
}
