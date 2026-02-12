"use client";

import { useEffect, useState } from "react";
import { addPostCountListener } from "@/src/features/post/utils/postCountEvents";

export function useOptimisticPostCount(baseCount: number) {
  const [delta, setDelta] = useState(0);

  useEffect(() => {
    const unsubscribe = addPostCountListener(({ delta: change }) => {
      setDelta((prev) => prev + change);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDelta(0);
  }, [baseCount]);

  return Math.max(0, baseCount + delta);
}
