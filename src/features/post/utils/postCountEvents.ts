export const POST_COUNT_EVENT = "post:count-change";

export type PostCountChangeDetail = {
  delta: number;
};

export function dispatchPostCountChange(delta: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<PostCountChangeDetail>(POST_COUNT_EVENT, {
      detail: { delta },
    }),
  );
}

export function addPostCountListener(
  handler: (detail: PostCountChangeDetail) => void,
) {
  if (typeof window === "undefined") return () => {};

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<PostCountChangeDetail>).detail;
    if (!detail) return;
    handler(detail);
  };

  window.addEventListener(POST_COUNT_EVENT, listener);
  return () => window.removeEventListener(POST_COUNT_EVENT, listener);
}
