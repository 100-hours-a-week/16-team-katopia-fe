"use client";

import { memo, useCallback, useEffect, useState } from "react";
import type { MutableRefObject } from "react";

import StyleSection from "@/src/features/signup/components/SignupStep2/StyleSection";

type StyleSectionBlockProps = {
  initialStyles: string[];
  setStylesRef: (next: string[]) => void;
  styleErrorTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  setStylesSnapshot: (next: string[]) => void;
};

const StyleSectionBlock = memo(
  ({
    initialStyles,
    setStylesRef,
    styleErrorTimeoutRef,
    setStylesSnapshot,
  }: StyleSectionBlockProps) => {
    const [styles, setStyles] = useState<string[]>(() => initialStyles);
    const [styleError, setStyleError] = useState<string | null>(null);

    useEffect(() => {
      setStyles(initialStyles);
    }, [initialStyles]);

    useEffect(() => {
      setStylesRef(styles);
      setStylesSnapshot(styles);
    }, [styles, setStylesRef, setStylesSnapshot]);

    const toggleStyle = useCallback(
      (style: string) => {
        setStyles((prev) => {
          if (prev.includes(style)) {
            return prev.filter((item) => item !== style);
          }

          if (prev.length >= 2) {
            setStyleError("선호 스타일은 최대 2개 선택 가능합니다.");
            styleErrorTimeoutRef.current = setTimeout(
              () => setStyleError(null),
              2000,
            );
            return prev;
          }

          return [...prev, style];
        });
      },
      [styleErrorTimeoutRef],
    );

    return (
      <section className="px-4 py-8">
        <StyleSection
          styles={styles}
          onToggle={toggleStyle}
          error={styleError}
          labelClassName="text-sm"
        />
      </section>
    );
  },
);

StyleSectionBlock.displayName = "StyleSectionBlock";

export default StyleSectionBlock;
