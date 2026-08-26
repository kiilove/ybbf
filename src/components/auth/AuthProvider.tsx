import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

import Loader from '../shared/Loader';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, isProfileComplete, checkSession, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // 최초 렌더링 시 서버 세션 확인 (이미 메모리에 인증 정보가 있으면 중복 검사 방지)
  useEffect(() => {
    if (!isAuthenticated) {
      checkSession();
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // 로그인 상태이지만 필수 정보가 누락된 경우 추가정보 입력 페이지로 강제 리다이렉션하던 가드를 완화합니다.
    // 사용자가 다른 페이지를 구경하거나 이탈할 수 있도록 허용하고, 로그인 시점에만 재질문하여 유도합니다.
    /*
    if (isAuthenticated && !isProfileComplete && location.pathname !== '/additional-info') {
      navigate('/additional-info', { replace: true });
    }
    */
    
    // 로그인하지 않은 상태인데 회원 추가정보 입력 페이지 등에 직접 접근하는 경우 로그인 화면으로 차단 리다이렉트
    if (!isAuthenticated && location.pathname === '/additional-info') {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isProfileComplete, location.pathname, navigate, isLoading]);

  if (isLoading && !isAuthenticated) {
    return <Loader isLoading={isLoading} />;
  }

  return <>{children}</>;
}
