export interface MockImage {
  id: number;
  src: string;
}

export const MOCK_IMAGES: MockImage[] = Array.from({ length: 60 }).map(
  (_, idx) => ({
    id: idx + 1,
    src: `https://picsum.photos/seed/${idx + 1}/300/400`,
  }),
);
