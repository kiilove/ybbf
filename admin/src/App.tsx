import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import HeroPlayerList from './pages/hero/HeroPlayerList';
import HeroPlayerCreate from './pages/hero/HeroPlayerCreate';
import HeroPlayerEdit from './pages/hero/HeroPlayerEdit';
import LandingStringsPage from './pages/LandingStringsPage';
import MediaManagerPage from './pages/MediaManagerPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import NoticeManagerPage from './pages/NoticeManagerPage';
import ContestStaffManagerPage from './pages/ContestStaffManagerPage';

// 인증 보호용 라우트 가드 컴포넌트
function ProtectedRoute() {
  const { isAuthenticated, isLoading, checkSession } = useAuthStore();

  useEffect(() => {
    // 세션 유지 여부를 최초 1회 체크
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#64748b'
      }}>
        보안 세션을 확인하는 중입니다...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 라우트 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 보호된 관리자 라우트 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            {/* 기본 주소로 진입 시 히어로 선수 목록으로 리다이렉트 */}
            <Route index element={<Navigate to="/hero" replace />} />
            
            {/* 히어로 선수 관리 페이지 구조 */}
            <Route path="hero" element={<HeroPlayerList />} />
            <Route path="hero/new" element={<HeroPlayerCreate />} />
            <Route path="hero/edit/:id" element={<HeroPlayerEdit />} />

            {/* 랜딩페이지 하드코딩 텍스트 관리 */}
            <Route path="landing" element={<LandingStringsPage />} />

            {/* 미디어 아카이브 관리 */}
            <Route path="media" element={<MediaManagerPage />} />

            {/* 대회 및 시스템 설정 관리 */}
            <Route path="settings" element={<SystemSettingsPage />} />

            {/* 필수 공지사항 관리 */}
            <Route path="notices" element={<NoticeManagerPage />} />

            {/* 대회 관계자 계정 관리 */}
            <Route path="contest-staffs" element={<ContestStaffManagerPage />} />
            <Route path="admin/contest-staffs" element={<ContestStaffManagerPage />} />
          </Route>
        </Route>

        {/* 정의되지 않은 경로 진입 시 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
