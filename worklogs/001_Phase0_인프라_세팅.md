# Phase 0: 인프라 세팅

## 개요
서브페이지를 만들기 위한 기반 작업. React Router를 적용하고, 레이아웃 컴포넌트를 분리하여 공통 프레임워크를 구성합니다.

## 태스크 리스트
- [x] `App.tsx` → React Router + Layout 구조 리팩토링
- [x] `src/pages/` 디렉토리 생성
- [x] `src/components/layout/` — Nav, Footer, Layout 분리
- [x] `src/components/shared/` — 공통 컴포넌트 (PageHero, AthleteCard, FilterTabs) - 향후 개별 작업 시 생성 예정 (현재 Loader, CustomCursor만 이동)
- [x] `src/components/home/` — 홈 관련 컴포넌트 분리
- [x] Nav 메뉴 항목 → 실제 라우트 연결
- [x] 메인 페이지를 `pages/HomePage.tsx`로 이동

## 작업 기록
- 폴더 구조 생성 완료 (`pages`, `components/layout`, `components/shared`, `components/home`)
- `Layout.tsx` 컴포넌트 생성 후 `Nav`, `Footer` 및 `Lenis` 스크롤 로직 이관
- 기존 `App.tsx`에 있던 메인 페이지 콘텐츠를 `HomePage.tsx`로 분리
- `react-router-dom`을 활용하여 `App.tsx` 리팩토링 완료
- `Nav`, `Footer`의 일반 `<a>` 태그를 `<Link>` 컴포넌트로 변경하고 기획된 서브페이지 경로(`/, /legends, /media, /youth, /about`) 연결 완료
