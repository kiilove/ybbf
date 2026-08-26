import React, { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { AuthConfig } from '../types';

export interface AuthProviderProps {
  children: React.ReactNode;
  config?: AuthConfig;
  /** 로딩 상태 시 표시할 커스텀 로더 컴포넌트 */
  fallbackLoader?: React.ReactNode;
}

export function AuthProvider({ children, config, fallbackLoader }: AuthProviderProps) {
  const { isAuthenticated, checkSession, isLoading, setConfig } = useAuthStore();

  useEffect(() => {
    if (config) {
      setConfig(config);
    }
  }, [config, setConfig]);

  useEffect(() => {
    if (!isAuthenticated) {
      checkSession();
    }
  }, []);

  if (isLoading && !isAuthenticated) {
    if (fallbackLoader) {
      return <>{fallbackLoader}</>;
    }
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/50 text-sm font-sans">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span>인증 정보를 확인하는 중입니다...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
