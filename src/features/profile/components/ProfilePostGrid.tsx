type ProfilePostGridProps = {
  posts: {
    id: number;
    imageUrl: string;
  }[];
  loading?: boolean;
};

export default function ProfilePostGrid({
  posts,
  loading,
}: ProfilePostGridProps) {
  if (loading) {
    return (
      <div className="mt-6 grid grid-cols-3 gap-2 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] rounded bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-3 gap-2 px-4">
      {posts.map((post) => (
        <a
          key={post.id}
          href={`/post/${post.id}`}
          className="relative aspect-[3/4] overflow-hidden bg-gray-100"
        >
          <img
            src={post.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </a>
      ))}
    </div>
  );
}
