export type PostAuthor = {
  nickname: string;
  profileImageUrl?: string | null;
  profileImageObjectKey?: string | null;
  gender?: "M" | "F" | null;
  height?: number | null;
  weight?: number | null;
  memberId?: number | string;
  id?: number | string;
  userId?: number | string;
};

export type PostImageItem = {
  imageObjectKey?: string;
  imageUrl?: string;
  accessUrl?: string;
  url?: string;
  sortOrder?: number;
};

export type PostDetail = {
  id?: number | string;
  imageUrls?: PostImageItem[] | string[];
  imageObjectKeys?: PostImageItem[] | string[];
  content: string;
  isLiked: boolean;
  isBookmarked?: boolean;
  aggregate: {
    likeCount: number;
    commentCount: number;
  };
  createdAt: string;
  author: PostAuthor;
};
