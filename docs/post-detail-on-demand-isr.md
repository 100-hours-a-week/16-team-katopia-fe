# Post Detail On-Demand ISR 문서

## 1) 목적

- 게시글 상세의 정적 콘텐츠(이미지/본문/작성자/작성일)는 ISR 캐시를 활용해 빠르게 제공
- 사용자별/실시간 상태(좋아요, 북마크, 좋아요 수, 댓글 수, 댓글 목록)는 동적 경로로 분리해 최신성 보장

## 2) 현재 구조 요약

### 2-1. 정적(SSR/ISR) 영역

- 파일: `app/post/[postId]/page.tsx`
  - `export const revalidate = 3600`
  - `generateStaticParams() => []` (빌드 시 미생성, 요청 시 on-demand 생성)
- 파일: `src/features/post/api/getPostDetailServer.ts`
  - `fetch(..., { cache: "force-cache", next: { tags: [post-detail:{id}] } })`
  - 상세 정적 데이터 캐시 키를 tag로 관리

### 2-2. On-Demand Revalidate 엔드포인트

- 파일: `app/revalidate/post/[postId]/route.ts`
  - `revalidateTag(getPostDetailTag(postId), "max")`
  - `revalidatePath(/post/{postId}, "page")`
  - delete scope일 때 `/home`, `/search`, `/profile` 경로도 추가 무효화
- 인증
  - `REVALIDATE_SECRET` 일치 또는 `Authorization` 기반 `/api/members/me` 검증 성공 시 허용

### 2-3. 클라이언트 트리거

- 파일: `src/features/post/api/revalidatePostDetail.ts`
  - `/revalidate/post/{postId}` POST 호출
  - `keepalive: true`로 이동 중 요청 손실 최소화
  - 실패(status/payload) 로깅 포함

## 3) 사용자 인터랙션 처리 방식

## 3-1. 좋아요/북마크/좋아요 수/댓글 수(헤더 액션 영역)

- 파일: `src/features/post/components/PostContent.tsx`
- 처리 전략
  - `initialData`: SSR `initialPost` + 홈피드 캐시 seed를 첫 paint에 사용
  - React Query `useQuery(["post-viewer-state", postId])`로 viewer 상태 동기화
  - 쿼리 옵션:
    - `staleTime: 0`
    - `refetchOnMount: "always"`
    - `refetchOnReconnect: true`
    - `refetchOnWindowFocus: false`
  - 사용자 클릭 시 optimistic update 즉시 반영

## 3-2. ViewerState 경량 API

- 파일: `src/features/post/api/getPostDetailViewerState.ts`
- 역할
  - `isLiked`, `isBookmarked`, `aggregate.likeCount`, `aggregate.commentCount`만 경량 조회
  - 백엔드 필드 변형(`isLike/likeYn/likedYn`, `isBookmark/bookmarkYn/bookmarkedYn`)도 파싱

## 3-3. 댓글 목록/작성/삭제

- 댓글 목록: `getComments` 기반 별도 API 호출 (동적)
- 댓글 작성/삭제 성공 시:
  - 로컬 optimistic 반영
  - `revalidatePostDetail(postId, "update")` 호출로 ISR 캐시 무효화

## 4) Mutation -> 캐시 갱신 흐름

1. 사용자가 좋아요/북마크/댓글 액션 수행
2. UI는 optimistic update로 즉시 반영
3. API 성공 후 `revalidatePostDetail(postId, "update")` 호출
4. 서버에서 `revalidateTag + revalidatePath` 수행
5. 다음 상세 진입/요청 시 ISR 결과가 최신 데이터로 재생성

## 5) 왜 `/post/[postId]` 네트워크 요청은 계속 보이는가

- 이는 페이지 라우팅/문서(또는 RSC payload) 요청이며 비정상 아님
- 핵심은 내부 데이터가 캐시를 타는지 여부이며, 상세 정적 데이터는 ISR 캐시를 사용
- 동적 상태(ViewerState/댓글)는 별도 API로 최신성 확보

## 6) 운영 체크포인트

- `/revalidate/post/{id}` 응답 200 여부
- `revalidatePostDetail` warn 로그 발생 빈도
- 상세 진입 시 ViewerState API 응답값과 UI 상태 일치 여부
- 댓글 작성/삭제 후 재진입 시 commentCount 동기화 여부
