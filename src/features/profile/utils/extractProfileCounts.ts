type ProfileResponse = {
  aggregate?: {
    postCount?: number;
    followerCount?: number;
    followingCount?: number;
  };
};

export function extractProfileCounts(payload: ProfileResponse) {
  const aggregate = payload.aggregate;

  return {
    postCount: aggregate?.postCount ?? null,
    followerCount: aggregate?.followerCount ?? null,
    followingCount: aggregate?.followingCount ?? null,
  };
}
