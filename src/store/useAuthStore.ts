import { create } from 'zustand';
import { User, UserProfile } from '../types/auth';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isLoading: boolean;
  error: string | null;
  // Actions
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  loginWithSocial: (provider: 'kakao' | 'naver' | 'google') => Promise<boolean>;
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  completeAdditionalInfo: (profile: UserProfile) => Promise<boolean>;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isProfileComplete: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  // 1. 이메일 회원가입
  signUpWithEmail: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signUp(email, password);
      
      // 최근 성공 로그인 힌트 저장
      localStorage.setItem('ybbf_last_login_provider', 'email');
      
      set({
        user,
        isAuthenticated: true,
        isProfileComplete: false,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || '회원가입에 실패했습니다.', isLoading: false });
      return false;
    }
  },

  // 2. 이메일 로그인
  loginWithEmail: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.login(email, password);
      
      // 최근 성공 로그인 힌트 저장
      localStorage.setItem('ybbf_last_login_provider', 'email');
      
      set({
        user,
        isAuthenticated: true,
        isProfileComplete: user.profileComplete,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || '로그인에 실패했습니다.', isLoading: false });
      return false;
    }
  },

  // 3. 소셜 로그인
  loginWithSocial: async (provider) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.loginSocial(provider);
      
      // 최근 성공 로그인 힌트 저장
      localStorage.setItem('ybbf_last_login_provider', provider);
      
      set({
        user,
        isAuthenticated: true,
        isProfileComplete: user.profileComplete,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || '소셜 로그인에 실패했습니다.', isLoading: false });
      return false;
    }
  },

  // 4. 추가정보 등록 제출
  completeAdditionalInfo: async (profile) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await authService.submitAdditionalInfo(profile);
      set({
        user: updatedUser,
        isProfileComplete: true,
        isLoading: false,
      });
      return true;
    } catch (err: any) {
      set({ error: err.message || '추가정보 등록에 실패했습니다.', isLoading: false });
      return false;
    }
  },

  // 5. 새로고침 시 세션 정보 확인
  checkSession: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        set({
          user,
          isAuthenticated: true,
          isProfileComplete: user.profileComplete,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isProfileComplete: false,
        });
      }
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isProfileComplete: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // 6. 로그아웃 (로컬스토리지 힌트는 보존)
  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch (err) {
      console.error('로그아웃 요청이 서버에서 거부되었으나 클라이언트 세션을 강제 초기화합니다.', err);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isProfileComplete: false,
        isLoading: false,
        error: null,
      });
    }
  },
}));
