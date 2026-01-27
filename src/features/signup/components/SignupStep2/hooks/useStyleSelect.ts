import { useCallback, useRef, useState } from "react";

export function useStyleSelect(max = 2) {
  const [styles, setStyles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleStyle = useCallback(
    (style: string) => {
      setStyles((prev) => {
        if (prev.includes(style)) {
          setError(null);
          return prev.filter((s) => s !== style);
        }

        if (prev.length >= max) {
          setError(`스타일은 최대 ${max}개까지 선택 가능합니다.`);
          timerRef.current && clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setError(null), 2000);
          return prev;
        }

        setError(null);
        return [...prev, style];
      });
    },
    [max],
  );

  return { styles, error, toggleStyle };
}
