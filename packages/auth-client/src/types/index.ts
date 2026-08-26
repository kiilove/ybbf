export type UserRole = 'user' | 'athlete' | 'judge' | 'sponsor' | 'admin' | string;

export interface UserProfile {
  name: string;
  birth: string; // YYYY-MM-DD
  tel: string; // 010-XXXX-XXXX
  gym?: string; // 소속 체육관/단체
  gender?: 'm' | 'f' | ''; // 성별
  [key: string]: any;
}

export type SocialProvider = 'email' | 'kakao' | 'naver' | 'google';

export interface User {
  uid: string;
  email: string;
  provider: SocialProvider;
  profileComplete: boolean;
  profile?: UserProfile;
  roles?: UserRole[];
}

export interface AuthConfig {
  /** 백엔드 Auth API의 기본 URL (예: 'https://auth-api.example.com/api' 또는 '/api') */
  apiUrl?: string;
  /** 브랜드/서비스 표시 명칭 (기본값: '인증 시스템') */
  brandName?: string;
  /** 브랜드 태그라인 (기본값: '선수 인증 및 계정 서비스') */
  brandSubTitle?: string;
  /** 로컬스토리지에 저장할 최근 로그인 힌트 키 (기본값: 'ybbf_last_login_provider') */
  storageKey?: string;
  /** 로그인 성공 후 이동할 기본 리다이렉트 경로 (기본값: '/') */
  homeRoute?: string;
  /** 회원가입 경로 (기본값: '/signup') */
  signUpRoute?: string;
  /** 로그인 경로 (기본값: '/login') */
  loginRoute?: string;
  /** 추가정보 입력 경로 (기본값: '/additional-info') */
  additionalInfoRoute?: string;
  /** 계정 찾기 경로 (기본값: '/find-account') */
  findAccountRoute?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isLoading: boolean;
  error: string | null;
  config: AuthConfig;
  
  setConfig: (config: Partial<AuthConfig>) => void;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  loginWithSocial: (provider: Exclude<SocialProvider, 'email'>) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  completeAdditionalInfo: (profile: UserProfile) => Promise<boolean>;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}
