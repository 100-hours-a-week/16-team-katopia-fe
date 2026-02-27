// 친구 추천 카드 렌더링 전용 UI 모델
export type HomeRecommendationMember = {
  id: number;
  name: string;
  heightCm: number;
  weightKg: number;
  styles: string[];
  avatarUrl?: string | null;
};
