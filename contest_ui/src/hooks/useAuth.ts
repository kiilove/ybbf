import { create } from 'zustand';
import { authService } from '../services/authService';
import type { Staff } from '../services/authService';

interface AuthState {
  staff: Staff | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCheckedSession: boolean;
  error: string | null;
  signupSuccess: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (
    username: string, 
    password: string, 
    name: string, 
    phone?: string, 
    email?: string, 
    position?: string, 
    isReferee?: number,
    refereeGrade?: string
  ) => Promise<boolean>;
  checkUsername: (username: string) => Promise<boolean>;
  checkSession: (force?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  verifyPassword: (password: string) => Promise<boolean>;
  changePassword: (newPassword: string) => Promise<boolean>;
  updateProfile: (
    profilePhotoUrl?: string,
    businessIntro?: string,
    snsLinks?: { instagram?: string; youtube?: string; [key: string]: string | undefined },
    name?: string,
    position?: string,
    isReferee?: boolean,
    refereeGrade?: string
  ) => Promise<boolean>;
  clearError: () => void;
  resetSignupSuccess: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  staff: null,
  isAuthenticated: false,
  isLoading: false,
  hasCheckedSession: false,
  error: null,
  signupSuccess: false,

  clearError: () => set({ error: null }),
  resetSignupSuccess: () => set({ signupSuccess: false }),

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const staff = await authService.login(username, password);
      set({
        staff,
        isAuthenticated: true,
        hasCheckedSession: true,
        isLoading: false,
      });
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      set({ error: errMsg, isLoading: false });
      return false;
    }
  },

  signup: async (username, password, name, phone, email, position, isReferee, refereeGrade) => {
    set({ isLoading: true, error: null, signupSuccess: false });
    try {
      await authService.signup(username, password, name, phone, email, position, isReferee, refereeGrade);
      set({
        signupSuccess: true,
        isLoading: false,
      });
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '회원가입에 실패했습니다.';
      set({ error: errMsg, isLoading: false });
      return false;
    }
  },

  checkUsername: async (username) => {
    set({ isLoading: true, error: null });
    try {
      const available = await authService.checkUsername(username);
      set({ isLoading: false });
      return available;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '아이디 중복 확인에 실패했습니다.';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  checkSession: async (force = false) => {
    const { hasCheckedSession, isAuthenticated } = get();
    if (hasCheckedSession && isAuthenticated && !force) {
      return;
    }

    set({ isLoading: true });
    try {
      const staff = await authService.getCurrentStaff();
      if (staff) {
        set({
          staff,
          isAuthenticated: true,
          hasCheckedSession: true,
        });
      } else {
        set({
          staff: null,
          isAuthenticated: false,
          hasCheckedSession: true,
        });
      }
    } catch {
      set({
        staff: null,
        isAuthenticated: false,
        hasCheckedSession: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch (err) {
      console.error('로그아웃 중 오류가 발생했으나 클라이언트 세션을 강제 종료합니다.', err);
    } finally {
      set({
        staff: null,
        isAuthenticated: false,
        hasCheckedSession: false,
        isLoading: false,
        error: null,
      });
    }
  },

  verifyPassword: async (password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.verifyPassword(password);
      set({ isLoading: false });
      return result;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '비밀번호 확인에 실패했습니다.';
      set({ error: errMsg, isLoading: false });
      return false;
    }
  },

  changePassword: async (newPassword) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.changePassword(newPassword);
      set({ isLoading: false });
      return result;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.';
      set({ error: errMsg, isLoading: false });
      return false;
    }
  },

  updateProfile: async (profilePhotoUrl, businessIntro, snsLinks, name, position, isReferee, refereeGrade) => {
    const { staff } = get();
    if (!staff) return false;
    set({ isLoading: true, error: null });
    try {
      await authService.saveAdditionalInfo(
        staff.username,
        profilePhotoUrl,
        businessIntro,
        snsLinks,
        name,
        position,
        isReferee,
        refereeGrade
      );
      // 세션 갱신 (force=true)
      await get().checkSession(true);
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '프로필 정보 수정에 실패했습니다.';
      set({ error: errMsg, isLoading: false });
      return false;
    }
  }
}));
