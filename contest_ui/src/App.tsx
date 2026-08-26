import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/auth/LoginPage';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/dashboard/DashboardPage';
import RegistrationListPage from './pages/registrations/RegistrationListPage';
import PreMeasurementListPage from './pages/pre_measurements/PreMeasurementListPage';
import PhotoManagementPage from './pages/photos/PhotoManagementPage';
import MyPage from './pages/mypage/MyPage';

// Protected Route Guard Component
function ProtectedRoute() {
  const { isAuthenticated, isLoading, hasCheckedSession, checkSession } = useAuth();

  useEffect(() => {
    if (!hasCheckedSession) {
      checkSession();
    }
  }, [hasCheckedSession, checkSession]);

  if (isLoading && !hasCheckedSession) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#9ca3af',
        backgroundColor: '#0b0f19'
      }}>
        보안 세션을 확인하는 중입니다...
      </div>
    );
  }

  if (hasCheckedSession && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected admin/staff routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* Redirect root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="registrations" element={<RegistrationListPage />} />
            <Route path="photos" element={<PhotoManagementPage />} />
            <Route path="pre-measurements" element={<PreMeasurementListPage />} />
            <Route path="mypage" element={<MyPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
