type ProfileAggregate = {
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
};

type ProfileResponse = {
  aggregate?: ProfileAggregate;
  data?: {
    aggregate?: ProfileAggregate;
  };
};

function toNumberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function extractProfileCounts(payload: ProfileResponse) {
  const aggregate = payload.data?.aggregate ?? payload.aggregate;

  return {
    postCount: toNumberOrNull(aggregate?.postCount),
    followerCount: toNumberOrNull(aggregate?.followerCount),
    followingCount: toNumberOrNull(aggregate?.followingCount),
  };
}
