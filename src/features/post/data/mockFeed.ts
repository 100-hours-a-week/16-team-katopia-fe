export interface MockComment {
  id: number;
  nickname: string;
  content: string;
  isMine?: boolean;
}

export interface MockFeed {
  id: number;
  nickname: string;
  height: number;
  weight: number;
  footSize: number;
  createdAt: string;
  likes: number;
  images: string[];
  content: string;
  comments: MockComment[];
}

export const MOCK_FEED: MockFeed = {
  id: 1,
  nickname: "닉네임",
  height: 160,
  weight: 40,
  footSize: 240,
  createdAt: "2025.12.29 19:58",
  likes: 124,
  images: [
    "https://picsum.photos/seed/feed1/400/600",
    "https://picsum.photos/seed/feed2/400/600",
    "https://picsum.photos/seed/feed3/400/600",
  ],
  content: "게시글 내용이 입력이 됩니다.",
  comments: Array.from({ length: 40 }).map((_, idx) => ({
    id: idx + 1,
    nickname: `닉네임${idx + 1}`,
    content: `댓글 ${idx + 1} 입니다.`,
    isMine: idx % 7 === 0,
  })),
};
