# Phase 1: 레전드 시스템

## 개요
협회의 핵심 자산인 대회 입상자를 집중 조명하는 "레전드" 페이지 구현. On-Track 페이지의 거대 숫자 스탯, 프리미엄 테이블 디자인 패턴을 차용합니다.

## 태스크 리스트
- [x] `src/data/legends.ts` — 더미 데이터 설계
- [x] `/legends` 전체 목록 페이지
  - [x] 히어로 섹션 (거대 타이포)
  - [x] Giant Stats 섹션
  - [x] 선수 그리드 + 필터
- [x] `/legends/:id` 상세 페이지
  - [x] WebGL 히어로 재활용
  - [x] 전적 테이블
  - [x] 갤러리 + 미디어
- [x] 메인 `HallOfFame` → "LEGEND COLLECTION" 리브랜딩
- [x] 메인 `StageSections ON` → "LEGENDS HIGHLIGHT" 리브랜딩

## 작업 기록
- `src/data/legends.ts` 더미 데이터 설계 완료
- `LegendsPage.tsx` 생성: On-Track 스타일의 거대 숫자 스탯과 카드 레이아웃 구현
- `LegendDetailPage.tsx` 생성: WebGLHero 컴포넌트 재활용, 선수 이미지 컷아웃 및 Calendar 스타일의 전적 테이블, 갤러리 그리드 구현
- `App.tsx`에 라우팅 연결 (`/legends`, `/legends/:id`) 완료
- 메인 페이지 컴포넌트 분리 및 리브랜딩
  - 기존 `HallOfFame.tsx`를 `LegendPreview.tsx`로 교체 (LEGEND COLLECTION)
  - 기존 `StageSections.tsx`를 `LegendHighlight.tsx` (ON STAGE -> LEGENDS HIGHLIGHT)와 `YouthPreview.tsx` (OFF STAGE -> YBBF YOUTH)로 분리 교체
  - 불필요해진 이전 파일 삭제 완료
- `LegendDetailPage.tsx` 리디자인 및 버그 수정:
  - 기존 `WebGLHero` 재활용 시 렌더링 컨텍스트 겹침 및 메뉴 가림 현상이 발생하여, 해당 페이지 전용의 고품질 커스텀 히어로 섹션으로 완전 재설계 (스타더스트 노이즈, 다크 그라데이션, 거대 타이포그래피 배경)
