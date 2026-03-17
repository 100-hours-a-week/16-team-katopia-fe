"use client";

import { memo, useCallback, useState } from "react";
import type { HomePost } from "../hooks/useInfiniteHomeFeed";
import HomePostActions from "./HomePostActions";
import HomePostCaption from "./HomePostCaption";
import HomePostHeader from "./HomePostHeader";
import HomePostMedia from "./HomePostMedia";

type HomePostCardProps = {
  post: HomePost;
  prioritizeMedia?: boolean;
};

function HomePostCard({ post, prioritizeMedia = false }: HomePostCardProps) {
  const [likeBurstTrigger, setLikeBurstTrigger] = useState(0);

  const handleLikeBurst = useCallback(() => {
    setLikeBurstTrigger((prev) => prev + 1);
  }, []);

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
        likeBurstTrigger={likeBurstTrigger}
      />
      <div className="px-1">
        <HomePostActions
          postId={post.id}
          likeCount={post.likeCount}
          commentCount={post.commentCount}
          isLiked={post.isLiked}
          isBookmarked={post.isBookmarked}
          onLikeBurst={handleLikeBurst}
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

export default memo(HomePostCard, (prev, next) => {
  return (
    prev.post === next.post && prev.prioritizeMedia === next.prioritizeMedia
  );
});
