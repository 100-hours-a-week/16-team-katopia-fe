export interface MockUserProfile {
  id: number;
  nickname: string;
  gender: "MAN" | "WOMAN";
  height: number;
  weight: number;
  profileImage?: string;
  posts: string[];
}

export const MOCK_USERS: MockUserProfile[] = [
  {
    id: 1,
    nickname: "닉네임1",
    gender: "MAN",
    height: 180,
    weight: 80,
    profileImage: undefined,
    posts: Array.from({ length: 6 }).map(
      (_, i) => `https://picsum.photos/seed/profile1-${i}/300/400`,
    ),
  },
  {
    id: 2,
    nickname: "닉네임2",
    gender: "WOMAN",
    height: 165,
    weight: 55,
    profileImage: undefined,
    posts: Array.from({ length: 9 }).map(
      (_, i) => `https://picsum.photos/seed/profile2-${i}/300/400`,
    ),
  },
  {
    id: 3,
    nickname: "닉네임3",
    gender: "MAN",
    height: 175,
    weight: 70,
    profileImage: undefined,
    posts: Array.from({ length: 6 }).map(
      (_, i) => `https://picsum.photos/seed/profile3-${i}/300/400`,
    ),
  },
  {
    id: 4,
    nickname: "닉네임4",
    gender: "WOMAN",
    height: 162,
    weight: 52,
    profileImage: undefined,
    posts: Array.from({ length: 6 }).map(
      (_, i) => `https://picsum.photos/seed/profile4-${i}/300/400`,
    ),
  },
];
