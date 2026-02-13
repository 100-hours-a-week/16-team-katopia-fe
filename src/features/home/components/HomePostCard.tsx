"use client";

import type { HomePost } from "../hooks/useInfiniteHomeFeed";
import HomePostActions from "./HomePostActions";
import HomePostCaption from "./HomePostCaption";
import HomePostHeader from "./HomePostHeader";
import HomePostMedia from "./HomePostMedia";

type HomePostCardProps = {
  post: HomePost;
};

export default function HomePostCard({ post }: HomePostCardProps) {
  return (
    <article className="flex flex-col gap-4">
      <HomePostHeader author={post.author} />
      <HomePostMedia
        postId={post.id}
        imageUrl={post.imageUrl}
        imageUrls={post.imageUrls}
      />
      <HomePostActions
        postId={post.id}
        likeCount={post.likeCount}
        commentCount={post.commentCount}
        isLiked={post.isLiked}
        isBookmarked={post.isBookmarked}
      />
      <HomePostCaption username={post.author.username} caption={post.caption} />
    </article>
  );
}
