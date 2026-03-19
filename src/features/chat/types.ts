export type ChatTab = "mine" | "open";

export type ChatRoom = {
  id: string;
  title: string;
  memberCount: number;
  thumbnailImageUrl?: string | null;
  thumbnailImageObjectKey?: string | null;
  isOwner?: boolean;
  joined?: boolean;
  unreadCount?: number;
  category: ChatTab;
};
