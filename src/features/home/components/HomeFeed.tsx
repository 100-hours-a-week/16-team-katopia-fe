"use client";

import HomePostCard from "./HomePostCard";
import type { HomePost } from "../hooks/useInfiniteHomeFeed";

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
