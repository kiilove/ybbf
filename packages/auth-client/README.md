# @ybbf/auth-client

React 전용 **회원가입, 로그인, 세션 관리, 비밀번호/계정 찾기, 추가정보 입력** 재사용 라이브러리 모듈입니다.

---

## 🚀 빠른 시작 (Quick Start)

### 1. 패키지 설치 / 프로젝트 연결

다른 React/Vite/Next.js 프로젝트에서 아래와 같이 로컬 패키지나 npm 패키지로 연결합니다.

```json
// 다른 프로젝트의 package.json
{
  "dependencies": {
    "@ybbf/auth-client": "file:../ybbf/packages/auth-client"
  }
}
```

### 2. Provider 설정 (`App.tsx` 또는 최상위 컴포넌트)

```tsx
import React from 'react';
import { AuthProvider } from '@ybbf/auth-client';

export default function App() {
  return (
    <AuthProvider
      config={{
        apiUrl: 'https://your-backend-api.com/api', // 백엔드 Auth API URL
        brandName: '내 서비스 이름',
        brandSubTitle: '안전한 회원 로그인',
      }}
    >
      <MyRouterComponents />
    </AuthProvider>
  );
}
```

### 3. 로그인 상태 & 유저 정보 사용 (`useAuthStore`)

```tsx
import React from 'react';
import { useAuthStore } from '@ybbf/auth-client';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <a href="/login">로그인</a>;
  }

  return (
    <div>
      <span>{user?.email}님 환영합니다!</span>
      <button onClick={logout}>로그아웃</button>
    </div>
  );
}
```

### 4. 준비된 UI 컴포넌트 사용

| 컴포넌트 | 설명 |
| :--- | :--- |
| `<LoginPage />` | 이메일/소셜 로그인 페이지 컴포넌트 |
| `<SignUpPage />` | 이메일 중복 체크 포함 회원가입 페이지 |
| `<FindAccountPage />` | 이메일(아이디) 및 비밀번호 찾기 탭 페이지 |
| `<ForgotPasswordPage />` | 비밀번호 재설정 이메일 전송 요청 페이지 |
| `<ResetPasswordPage />` | 이메일 토큰 기반 새 비밀번호 설정 페이지 |
| `<AdditionalInfoPage />` | 필수 신원/인적사항 추가 등록 페이지 |

#### 사용 예시:

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginPage } from '@ybbf/auth-client';

export default function CustomLoginPage() {
  const navigate = useNavigate();

  return (
    <LoginPage
      onSuccess={() => navigate('/')}
      onNavigateSignUp={() => navigate('/signup')}
      onNavigateFindAccount={() => navigate('/find-account')}
    />
  );
}
```

---

## 📦 제공 기능 및 API

- **`authService`**: 백엔드 API와의 직접 통신 (signUp, login, logout, checkEmail, findEmail 등)
- **`useAuthStore`**: Zustand 기반 인증 상태 관리 (유저 정보, 세션 체크, 오류 관리)
- **`useCheckEmail`**: 디바운스 적용 이메일 중복 검사 커스텀 훅
- **`AuthProvider`**: 자동 세션 조회 및 글로벌 설정 주입
