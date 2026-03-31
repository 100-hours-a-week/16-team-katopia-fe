# FITCHECK Frontend

패션 콘텐츠 공유, 사용자 관계 형성, 실시간 소통을 하나의 흐름으로 연결한 패션 특화형 SNS 프론트엔드 프로젝트입니다.  
이 저장소는 `Next.js` 기반 웹 클라이언트이며, 피드, 게시물, 검색, 프로필, 투표, 채팅, 알림 기능을 통합해 실제 서비스 운영을 고려한 사용자 경험을 제공합니다.

## 1. 프로젝트 개요

### 프로젝트명

- `FITCHECK`

### 프로젝트 한 줄 소개

- 사용자가 자신의 코디와 스타일을 공유하고, 팔로우·좋아요·댓글·알림·실시간 채팅으로 상호작용할 수 있는 패션 SNS 플랫폼

### 프로젝트 배포/테스트 기준 주소

- 개발 테스트 기준 URL: `https://dev.fitcheck.kr`

## 2. 프로젝트 배경 및 필요성

### 2.1 프로젝트 배경

- 패션 콘텐츠 공유와 사용자 간 소통 수요가 증가하면서, 단순 게시판을 넘어 피드, 팔로우, 채팅, 알림 기능이 결합된 SNS형 서비스의 필요성이 커졌습니다.
- 기존의 단순 정보 제공형 서비스는 사용자 참여도와 체류 시간을 높이는 데 한계가 있어, 실시간 상호작용이 가능한 사용자 중심 플랫폼이 필요했습니다.
- 패션은 개인의 취향과 스타일 표현이 핵심인 분야이므로, 사용자가 자신의 코디와 일상 패션을 손쉽게 공유하고 다른 사용자와 교류할 수 있는 전용 커뮤니티 플랫폼이 요구되었습니다.
- 사용자 수 증가와 기능 확장에 대응하기 위해, 피드 조회, 알림 발송, 채팅 처리 등 기능별 특성을 고려한 확장 가능한 구조 설계가 필요했습니다.

### 2.2 프로젝트 목적

- 패션 콘텐츠 공유와 사용자 간 관계 형성을 지원하는 패션 특화형 SNS 플랫폼 구현
- 피드, 게시, 팔로우, 실시간 채팅, 알림 기능을 통해 사용자 참여도와 커뮤니티 활성화를 높일 수 있는 서비스 환경 구축
- 사용자 증가와 트래픽 집중 상황에서도 안정적으로 운영할 수 있도록 확장성과 성능을 고려한 프론트엔드 구조 설계
- 게시물 등록/조회, 사용자 관계 관리, 메시지 전달, 이벤트 알림 등 SNS 핵심 기능을 통합하여 실제 서비스 운영을 고려한 화면과 흐름 제공

## 3. 프로젝트 범위

### 3.1 대상 서비스

- 패션 콘텐츠 중심의 소셜 네트워크 서비스 플랫폼
- 사용자 간 관계 형성과 상호작용이 가능한 커뮤니티 환경
- 실시간 소통 기능을 지원하는 채팅 기반 서비스

### 3.2 구현 범위

- 게시물 작성, 조회, 수정, 삭제
- 이미지 업로드 및 미리보기 처리
- 팔로우/언팔로우 기반 사용자 관계 형성
- 좋아요, 댓글, 북마크 등 콘텐츠 반응 기능
- 검색 기반 사용자/게시물 탐색
- 프로필 조회 및 편집
- 투표형 콘텐츠 생성 및 결과 조회
- SSE 기반 알림 수신
- WebSocket(STOMP) 기반 실시간 채팅

## 4. 주요 기능

### 홈 피드

- 추천 사용자와 피드 게시물을 한 화면에서 제공
- 무한 스크롤 및 가상화 적용으로 많은 게시물도 효율적으로 렌더링
- 좋아요, 북마크, 상세 이동 등 피드 중심 상호작용 제공

### 게시물

- 이미지 포함 게시물 작성/수정/삭제
- 댓글 작성, 수정, 삭제
- 좋아요/좋아요 취소, 북마크/북마크 취소
- 상세 페이지 캐시 무효화 및 재검증 처리 지원

### 검색

- 사용자 검색
- 게시물 및 해시태그 기반 검색
- 검색 전/후 상태를 분리한 탐색 UX 제공

### 프로필

- 내 프로필/다른 사용자 프로필 조회
- 작성 게시물, 북마크, 투표 내역 확인
- 프로필 이미지 및 사용자 정보 수정
- 팔로워/팔로잉 목록 조회

### 투표

- 이미지 기반 투표 생성
- 카드 스택 UI를 활용한 투표 참여
- 결과 조회 및 내 투표 목록 관리

### 채팅

- 내가 참여한 채팅방 / 오픈 채팅방 목록 제공
- 채팅방 생성, 참여, 수정, 삭제, 나가기
- 실시간 메시지 송수신
- 대화 목록 가상화 및 상향 무한 스크롤 최적화

### 알림

- SSE 기반 실시간 알림 수신
- 읽음 처리 및 알림 목록 무한 스크롤
- 토스트 알림과 알림 페이지 연동

## 5. 기술 스택

### Language

- `TypeScript`

### Framework

- `Next.js 16` (`App Router`)
- `React 19`

### Styling/UI

- `Tailwind CSS 4`
- `embla-carousel-react`
- `framer-motion`
- `motion`
- `lucide-react`

### State / Data Fetching

- `@tanstack/react-query`
- `zustand`
- Custom `AuthProvider` + `authFetch`

### Form / Validation

- `react-hook-form`
- `zod`
- `@hookform/resolvers`

### Real-time / Communication

- `@stomp/stompjs`
- `event-source-polyfill`
- `sockjs-client`

### Performance / UX

- `@tanstack/react-virtual`
- `react-window`
- `react-window-infinite-loader`
- `react-virtualized-auto-sizer`

### Upload / Media Processing

- `heic2any`

### Test / Quality

- `Playwright`
- `ESLint`
- `Prettier`

## 6. 기술적 특징

### 6.1 Next.js App Router 기반 구조

- `app/` 디렉터리 중심 라우팅
- 페이지 단위 SSR/CSR 혼합 구성
- Route Handler를 활용한 일부 서버 측 처리 및 revalidate 엔드포인트 구성

### 6.2 인증 흐름

- 액세스 토큰 발급 및 만료 시 재발급 처리
- 인증 상태를 전역 `AuthProvider`에서 관리
- 보호 페이지 접근 시 로그인 유도 및 인증 실패 이벤트 처리

### 6.3 실시간 기능

- 채팅: `WebSocket + STOMP` 기반 실시간 메시지 송수신
- 알림: `SSE(EventSource)` 기반 실시간 알림 스트림 수신

### 6.4 성능 최적화

- 홈 피드와 채팅 메시지 목록에 가상 스크롤 적용
- 메모이제이션을 통한 불필요한 렌더링 감소
- 이미지 업로드 전 클라이언트 측 변환/리사이즈 처리
- 게시물 상세 캐시 재검증 및 경로 revalidate 지원

### 6.5 사용자 경험 개선

- 토스트 알림, 온보딩/모달 흐름, 낙관적 UI 일부 적용
- 모바일 중심 SNS 인터랙션에 맞춘 화면 구성
- 프로필, 피드, 채팅, 알림 흐름이 자연스럽게 연결되는 구조

## 7. 프로젝트 구조

```bash
.
├── app/                      # Next.js App Router 페이지 및 route handler
│   ├── api/                  # 일부 BFF/route handler
│   ├── chat/                 # 채팅 페이지
│   ├── home/                 # 홈 피드 페이지
│   ├── notifications/        # 알림 페이지
│   ├── post/                 # 게시물 페이지
│   ├── profile/              # 프로필 페이지
│   ├── search/               # 검색 페이지
│   └── vote/                 # 투표 페이지
├── src/
│   ├── config/               # API/환경 설정
│   ├── features/             # 도메인별 기능 모듈
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── home/
│   │   ├── notifications/
│   │   ├── post/
│   │   ├── profile/
│   │   ├── search/
│   │   ├── signup/
│   │   ├── upload/
│   │   └── vote/
│   ├── shared/               # 공통 컴포넌트/유틸/스타일
│   └── lib/                  # 인증 등 공통 로직
├── public/                   # 정적 이미지/아이콘
├── tests/                    # Playwright E2E 테스트
└── docs/                     # 기능 문서 및 시나리오 문서
```

## 8. 실행 방법

### 요구 사항

- `Node.js`
- `npm`

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

### 프로덕션 빌드

```bash
npm run build
npm run start
```

## 9. 환경 변수

프로젝트에서 확인되는 주요 환경 변수는 아래와 같습니다.

```bash
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_CHAT_SOCKET_URL=
NEXT_PUBLIC_IMAGE_BASE_URL=
NEXT_PUBLIC_KAKAO_OAUTH_URL=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_GTM_ID=
API_BASE_URL=
REVALIDATE_SECRET=
BASE_URL=
STORAGE_STATE=
```

### 환경 변수 설명

- `NEXT_PUBLIC_API_BASE_URL`: 백엔드 API 기본 주소
- `NEXT_PUBLIC_CHAT_SOCKET_URL`: 채팅 WebSocket 서버 주소
- `NEXT_PUBLIC_IMAGE_BASE_URL`: 이미지 CDN 기본 주소
- `NEXT_PUBLIC_KAKAO_OAUTH_URL`: 카카오 로그인 연동 주소
- `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GTM_ID`: 분석 도구 연동용 값
- `API_BASE_URL`: 서버 사이드 route handler에서 사용할 업스트림 API 주소
- `REVALIDATE_SECRET`: 캐시 재검증 보호용 시크릿
- `BASE_URL`: Playwright 테스트 기준 URL
- `STORAGE_STATE`: Playwright 로그인 상태 파일 경로

## 10. 사용 가능한 스크립트

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## 11. 테스트

이 프로젝트는 `Playwright` 기반 E2E 테스트를 사용합니다.

### 예시

```bash
npm run e2e:smoke
npm run e2e:chat-smoke
```

### 테스트 범위 예시

- 주요 페이지 진입 확인
- 네비게이션 이동 확인
- 채팅방 생성 및 메시지 전송 스모크 테스트

## 12. 기대 효과

- 패션 콘텐츠 중심의 사용자 참여형 커뮤니티 구축
- 게시물, 팔로우, 채팅, 알림을 연결한 높은 상호작용 경험 제공
- 실시간 기능과 성능 최적화를 통해 서비스 체류 시간 및 재방문 가능성 향상
- 확장 가능한 프론트엔드 구조를 바탕으로 기능 추가와 운영 대응 용이

## 13. 문서 참고

- `docs/chat-e2e-scenarios.md`
- `docs/post-detail-on-demand-isr.md`

## 14. 한계 및 참고 사항

- 이 저장소는 프론트엔드 중심 저장소이며, 실제 서비스 동작에는 별도의 백엔드/API 서버가 필요합니다.
- 일부 기능은 외부 API, OAuth, 이미지 CDN, 실시간 소켓 서버 연결이 전제됩니다.
- 현재 코드베이스에는 운영 최적화와 기능 안정화를 위한 성능 개선 이력이 다수 반영되어 있습니다.
