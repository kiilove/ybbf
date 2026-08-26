import { User, UserProfile, SocialProvider } from '../types';

let currentApiUrl = typeof process !== 'undefined' && process.env?.VITE_AUTH_API_URL 
  ? `${process.env.VITE_AUTH_API_URL}/api`
  : 'http://localhost:4200/api';

export function setAuthServiceApiUrl(url: string) {
  if (!url) return;
  // Ensure /api trailing if not included, or handle flexible path
  const trimmed = url.replace(/\/$/, '');
  currentApiUrl = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export function getAuthServiceApiUrl() {
  return currentApiUrl;
}

async function handleResponseError(response: Response): Promise<Error> {
  try {
    const data = await response.json();
    return new Error(data.error || 'API 요청 중 알 수 없는 에러가 발생했습니다.');
  } catch {
    return new Error(`서버 요청 실패 (상태 코드: ${response.status})`);
  }
}

export const authService = {
  // 1. 회원가입
  async signUp(email: string, password: string): Promise<User> {
    const res = await fetch(`${currentApiUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    if (data.user?.uid) {
      localStorage.setItem('session_token', data.user.uid);
    }
    return data.user;
  },

  // 2. 이메일 로그인
  async login(email: string, password: string): Promise<User> {
    const res = await fetch(`${currentApiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    if (data.user?.uid) {
      localStorage.setItem('session_token', data.user.uid);
    }
    return data.user;
  },

  // 3. 소셜 로그인
  async loginSocial(provider: Exclude<SocialProvider, 'email'>): Promise<User> {
    const res = await fetch(`${currentApiUrl}/auth/login/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    if (data.user?.uid) {
      localStorage.setItem('session_token', data.user.uid);
    }
    return data.user;
  },

  // 4. 현재 유저 세션 조회
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('session_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${currentApiUrl}/auth/me`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        localStorage.removeItem('session_token');
        return null;
      }

      const data = await res.json();
      if (data.user?.uid) {
        localStorage.setItem('session_token', data.user.uid);
      }
      return data.user;
    } catch {
      return null;
    }
  },

  // 5. 로그아웃
  async logout(): Promise<void> {
    const token = localStorage.getItem('session_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    localStorage.removeItem('session_token');

    const res = await fetch(`${currentApiUrl}/auth/logout`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }
  },

  // 6. 추가정보 등록
  async submitAdditionalInfo(profile: UserProfile): Promise<User> {
    const token = localStorage.getItem('session_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${currentApiUrl}/auth/additional-info`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return data.user;
  },

  // 7. 비밀번호 찾기 이메일 발송
  async sendForgotPasswordEmail(email: string): Promise<boolean> {
    const res = await fetch(`${currentApiUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return !!data.success;
  },

  // 8. 비밀번호 재설정 실행
  async confirmPasswordReset(token: string, newPassword: string): Promise<boolean> {
    const res = await fetch(`${currentApiUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token, newPassword }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return !!data.success;
  },

  // 9. 이메일(아이디) 찾기
  async findEmail(name: string, tel: string): Promise<{ email: string; createdAt?: string }> {
    const res = await fetch(`${currentApiUrl}/auth/find-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, tel }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return { email: data.email, createdAt: data.createdAt };
  },

  // 10. 이메일 중복 체크
  async checkEmail(email: string): Promise<boolean> {
    const res = await fetch(`${currentApiUrl}/auth/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return !!data.exists;
  },
};
