"use client";

import HomePostCard from "./HomePostCard";

export type HomePost = {
  id: string;
  author: {
    displayName: string;
    username: string;
    avatarUrl?: string | null;
  };
  imageUrl?: string | null;
  imageCount?: number;
  likeCount: number;
  commentCount: number;
  caption: string;
};

type HomeFeedProps = {
  posts: HomePost[];
};

export default function HomeFeed({ posts }: HomeFeedProps) {
  return (
    <section className="flex flex-col gap-10 pb-12">
      {posts.map((post) => (
        <HomePostCard key={post.id} post={post} />
      ))}
    </section>
  );
}
