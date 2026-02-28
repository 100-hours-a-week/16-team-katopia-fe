"use client";

import type { HomePost } from "../hooks/useInfiniteHomeFeed";
import HomePostActions from "./HomePostActions";
import HomePostCaption from "./HomePostCaption";
import HomePostHeader from "./HomePostHeader";
import HomePostMedia from "./HomePostMedia";

type HomePostCardProps = {
  post: HomePost;
  prioritizeMedia?: boolean;
};

export default function HomePostCard({
  post,
  prioritizeMedia = false,
}: HomePostCardProps) {
  return (
    <article className="flex flex-col gap-4">
      <div className="px-1">
        <HomePostHeader author={post.author} />
      </div>
      <HomePostMedia
        postId={post.id}
        imageUrl={post.imageUrl}
        imageUrls={post.imageUrls}
        prioritizeFirstImage={prioritizeMedia}
      />
      <div className="px-1">
        <HomePostActions
          postId={post.id}
          likeCount={post.likeCount}
          commentCount={post.commentCount}
          isLiked={post.isLiked}
          isBookmarked={post.isBookmarked}
        />
      </div>
      <div className="px-1">
        <HomePostCaption
          username={post.author.username}
          caption={post.caption}
        />
      </div>
    </article>
  );
}
