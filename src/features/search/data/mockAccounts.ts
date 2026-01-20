export interface MockAccount {
  id: number;
  nickname: string;
  profileImage?: string;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  { id: 1, nickname: "닉네임1" },
  { id: 2, nickname: "닉네임1" },
  { id: 3, nickname: "닉네임1" },
  { id: 4, nickname: "닉네임1" },
];
