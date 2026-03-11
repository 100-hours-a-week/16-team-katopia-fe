type ExtractedProfileCounts = {
  postCount: number | null;
  followerCount: number | null;
  followingCount: number | null;
};

const POST_COUNT_KEYS = [
  "postCount",
  "postsCount",
  "postCnt",
  "totalPostCount",
  "totalPostsCount",
  "totalPost",
];

const FOLLOWER_COUNT_KEYS = [
  "followerCount",
  "followersCount",
  "followerCnt",
  "totalFollowerCount",
];

const FOLLOWING_COUNT_KEYS = [
  "followingCount",
  "followingsCount",
  "followingCnt",
  "totalFollowingCount",
];

function toObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function findFirstCount(
  sources: Record<string, unknown>[],
  keys: readonly string[],
): number | null {
  for (const source of sources) {
    for (const key of keys) {
      const count = toCount(source[key]);
      if (count !== null) return count;
    }
  }
  return null;
}

function collectSources(payload: unknown): Record<string, unknown>[] {
  const sources: Record<string, unknown>[] = [];
  const queue: unknown[] = [payload];
  const nestedKeys = [
    "data",
    "profile",
    "aggregate",
    "stats",
    "statistics",
    "count",
    "counts",
    "summary",
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    const obj = toObject(current);
    if (!obj) continue;

    sources.push(obj);
    for (const key of nestedKeys) {
      queue.push(obj[key]);
    }
  }

  return sources;
}

export function extractProfileCounts(payload: unknown): ExtractedProfileCounts {
  const sources = collectSources(payload);

  return {
    postCount: findFirstCount(sources, POST_COUNT_KEYS),
    followerCount: findFirstCount(sources, FOLLOWER_COUNT_KEYS),
    followingCount: findFirstCount(sources, FOLLOWING_COUNT_KEYS),
  };
}
