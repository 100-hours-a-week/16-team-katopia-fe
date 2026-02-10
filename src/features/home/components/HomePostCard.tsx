"use client";

import type { HomePost } from "./HomeFeed";
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
      <HomePostMedia imageUrl={post.imageUrl} />
      <HomePostActions
        likeCount={post.likeCount}
        commentCount={post.commentCount}
      />
      <HomePostCaption username={post.author.username} caption={post.caption} />
    </article>
  );
}
