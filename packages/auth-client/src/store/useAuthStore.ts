import { create } from 'zustand';
import { AuthConfig, AuthState, UserProfile } from '../types';
import { authService, setAuthServiceApiUrl } from '../services/authService';

const defaultConfig: AuthConfig = {
  brandName: '인증 시스템',
  brandSubTitle: '사용자 회원가입 및 로그인 서비스',
  storageKey: 'ybbf_last_login_provider',
  homeRoute: '/',
  signUpRoute: '/signup',
  loginRoute: '/login',
  additionalInfoRoute: '/additional-info',
  findAccountRoute: '/find-account',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isProfileComplete: false,
  isLoading: false,
  error: null,
  config: defaultConfig,

  setConfig: (newConfig) => {
    const updated = { ...get().config, ...newConfig };
    if (updated.apiUrl) {
      setAuthServiceApiUrl(updated.apiUrl);
    }
    set({ config: updated });
  },

  clearError: () => set({ error: null }),

  // 1. 이메일 회원가입
  signUpWithEmail: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signUp(email, password);
      const storageKey = get().config.storageKey || 'ybbf_last_login_provider';
      localStorage.setItem(storageKey, 'email');

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
      const storageKey = get().config.storageKey || 'ybbf_last_login_provider';
      localStorage.setItem(storageKey, 'email');

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
      const storageKey = get().config.storageKey || 'ybbf_last_login_provider';
      localStorage.setItem(storageKey, provider);

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
  completeAdditionalInfo: async (profile: UserProfile) => {
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

  // 5. 세션 확인
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

  // 6. 로그아웃
  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch (err) {
      console.error('로그아웃 세션 초기화 경고:', err);
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
