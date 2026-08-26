# YBBF 독립 관리자 포털 서브 프로젝트 (admin)

본 프로젝트는 YBBF 플랫폼의 시스템 관리자 전용 독립 싱글 페이지 어플리케이션(SPA)입니다. 기존 프론트엔드 코드베이스와의 파일 충돌 및 병합 문제를 방지하기 위해 완전히 분리되어 개발되었습니다. `admin.ybbf.org` 도메인(또는 별도 포트)으로 배포 및 가동됩니다.

---

## 🔒 보안 아키텍처 및 라우트 보호

1. **초강력 어드민 보안 가드 (`AdminGuard`)**
   - 어드민 페이지 루트(`/`)로 진입하는 모든 요청은 `AdminGuard`를 통해 강제 차단됩니다.
   - 로딩 즉시 서버 세션(`GET /api/auth/me`)을 실시간 조회하며, 미로그인이거나 유저 역할(`roles`)에 `'admin'` 권한이 없는 경우 **페이지를 찾을 수 없습니다 (404)** 위장 에러 화면을 노출합니다.
   - 비관리자는 어드민의 제어판 메뉴나 소스 데이터의 흔적을 1px도 볼 수 없습니다.

2. **숨겨진 로그인 엔드포인트**
   - 관리자가 로그인을 수행하기 위해서는 직접 주소창에 `/login` 경로를 쳐서 접근해야 합니다.
   - 로그인에 성공하면 어드민 제어판(`/`)으로 이동하며, 어드민 권한이 확인되지 않으면 즉시 위장 404 차단 뷰로 전환됩니다.

---

## ⚙️ 로컬 Mock 모드 (개발 편의 기능)

- API 서버(포트 4300)나 인증 서버(포트 4200)가 로컬에서 실행 중이지 않더라도, 어드민 기능 전체를 단독 검증할 수 있도록 **Mocking 모드**를 지원합니다.
- `/login` 화면 하단의 **"Mock 모드 활성화 (가상 로컬 데모 사용)"** 링크를 클릭하여 모드를 전환할 수 있습니다.
- **Mock 모드 테스트 계정 정보**:
  - **이메일**: `admin@ybbf.org`
  - **비밀번호**: `admin1234`
- Mock 모드가 켜진 경우, 모든 CRUD 작업은 브라우저의 `localStorage` (`ybbf_mock_settings`, `ybbf_mock_users`, `ybbf_mock_session`) 상에서 안전하게 보존되며, 이미지 업로드 시에도 가상 목업 이미지 URL을 실시간 생성하여 렌더링을 지원합니다.

---

## 📂 파일 구조 및 컴포넌트

- [App.tsx](file:///d:/app2/ybbf/admin/src/App.tsx): 독립 라우팅 및 테마 세팅.
- [AdminGuard.tsx](file:///d:/app2/ybbf/admin/src/components/AdminGuard.tsx): 보안 세션 체킹 및 404 위장 쉴드 컴포넌트.
- [AdminPanel.tsx](file:///d:/app2/ybbf/admin/src/pages/AdminPanel.tsx): 깔끔한 라이트 테마 기반의 극도로 직관적인 표와 단층적 폼 그리드 어드민 제어판 종합 포털.
- [LoginPage.tsx](file:///d:/app2/ybbf/admin/src/pages/LoginPage.tsx): 세련된 어드민 전용 로그인 화면.
- [adminService.ts](file:///d:/app2/ybbf/admin/src/services/adminService.ts): 포트 4300의 API 서버와의 실시간 통신 및 Mock 폴백 로직.
- [authService.ts](file:///d:/app2/ybbf/admin/src/services/authService.ts): 포트 4200 인증 세션 헬퍼 및 Mock 로그인 처리.

---

## 🚀 로컬 구동 및 빌드 방법

독립 서브 프로젝트이므로 `admin/` 폴더 내에서 다음 명령어를 실행합니다.

```bash
# 1. 의존성 패키지 설치
npm install

# 2. 로컬 개발 서버 실행 (포트 4500에서 구동됨)
npm run dev

# 3. 배포용 정적 리소스 빌드 (TypeScript 컴파일 포함)
npm run build
```
