"use client";

import { useEffect, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { HomePost } from "../hooks/useInfiniteHomeFeed";
import HomePostCard from "./HomePostCard";

type HomeVirtualFeedProps = {
  posts: HomePost[];
};

// 동적 높이를 측정하기 전 사용하는 초기 추정 높이입니다.
const DEFAULT_ESTIMATED_ROW_HEIGHT = 760;

export default function HomeVirtualFeed({
  // 렌더링 대상 게시글 목록입니다.
  posts,
}: HomeVirtualFeedProps) {
  // 가상 리스트 컨테이너(section) DOM 참조입니다.
  const containerRef = useRef<HTMLElement | null>(null);
  // 리스트 시작점 보정을 위한 scrollMargin 상태입니다.
  const [scrollMargin, setScrollMargin] = useState(0);

  // 윈도우 스크롤 기반 virtualizer를 생성합니다.
  const rowVirtualizer = useWindowVirtualizer({
    // 현재 총 아이템 개수입니다.
    count: posts.length,
    // 초기 추정 아이템 높이 함수입니다.
    estimateSize: () => DEFAULT_ESTIMATED_ROW_HEIGHT,
    // 초기 렌더 오버헤드를 줄이기 위해 overscan을 낮게 유지합니다.
    overscan: 2,
    // 리스트 시작점과 문서 상단 사이 오프셋입니다.
    scrollMargin,
  });

  // 컨테이너의 문서 기준 Y 좌표를 측정해 scrollMargin을 갱신합니다.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateScrollMargin = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setScrollMargin((prev) => {
        const next = rect.top + window.scrollY;
        return prev === next ? prev : next;
      });
    };

    updateScrollMargin();
    window.addEventListener("resize", updateScrollMargin);
    window.addEventListener("orientationchange", updateScrollMargin);

    return () => {
      window.removeEventListener("resize", updateScrollMargin);
      window.removeEventListener("orientationchange", updateScrollMargin);
    };
  }, []);

  // 데이터 길이가 바뀌면 한 번 재측정해 높이 캐시를 보정합니다.
  useEffect(() => {
    if (!containerRef.current) return;
    rowVirtualizer.measure();
  }, [rowVirtualizer, posts.length]);

  // 현재 렌더링해야 할 가상 아이템 목록을 가져옵니다.
  const virtualItems = rowVirtualizer.getVirtualItems();

  // 가상 리스트 컨테이너와 가상 아이템들을 렌더링합니다.
  return (
    /* 피드 섹션 컨테이너입니다. */
    <section ref={containerRef} className="relative pb-12">
      {/* 전체 스크롤 높이를 차지하는 내부 래퍼입니다. */}
      <div
        className="relative"
        style={{
          // virtualizer가 계산한 총 높이를 적용합니다.
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {/* 현재 필요한 가상 아이템만 순회 렌더링합니다. */}
        {virtualItems.map((virtualRow) => {
          // 가상 인덱스로 실제 게시글을 찾습니다.
          const post = posts[virtualRow.index];
          // 데이터가 없으면 아무것도 렌더링하지 않습니다.
          if (!post) return null;

          // 각 가상 행을 절대 위치로 배치합니다.
          return (
            <div
              // key는 게시글 id를 사용합니다.
              key={post.id}
              // 실제 DOM 높이를 측정하기 위해 measureElement를 연결합니다.
              ref={rowVirtualizer.measureElement}
              // 디버깅/측정을 위한 현재 인덱스 속성입니다.
              data-index={virtualRow.index}
              // 절대 배치 + 기존 카드 간격 유지를 위한 하단 패딩입니다.
              className="absolute left-0 top-0 w-full pb-10"
              style={{
                // 가상 행 시작 위치로 Y축 이동시켜 배치합니다.
                transform: `translateY(${
                  virtualRow.start - rowVirtualizer.options.scrollMargin
                }px)`,
              }}
            >
              {/* 실제 게시글 카드 UI를 렌더링합니다. */}
              <HomePostCard
                // 현재 게시글 데이터를 전달합니다.
                post={post}
                // 초기 뷰포트 LCP 후보를 위해 상단 2개 카드에 우선 로딩 힌트를 전달합니다.
                prioritizeMedia={virtualRow.index < 2}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
