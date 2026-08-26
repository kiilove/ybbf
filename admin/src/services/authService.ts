import type { User } from '../types/auth';

const API_BASE_URL = `${import.meta.env.VITE_AUTH_API_URL || 'http://localhost:4200'}/api`;

// 에러 객체 생성 헬퍼
async function handleResponseError(response: Response) {
  try {
    const data = await response.json();
    return new Error(data.error || 'API 요청 중 알 수 없는 에러가 발생했습니다.');
  } catch {
    return new Error(`서버 요청 실패 (상태 코드: ${response.status})`);
  }
}

// 개발 모드 모킹 여부 확인 (로그인 목업이 필요 없으므로 항상 false 반환)
export const isMockMode = () => {
  return false;
};

export const authService = {
  // 1. 이메일 로그인
  async login(email: string, password: string): Promise<User> {
    if (isMockMode()) {
      if (email === 'admin@ybbf.org' && password === 'admin1234') {
        const mockAdminUser: User = {
          uid: 'mock-admin-uid-12345',
          email: 'admin@ybbf.org',
          provider: 'email',
          profileComplete: true,
          roles: ['admin'],
          profile: {
            name: '최고관리자',
            birth: '1990-01-01',
            tel: '010-0000-0000',
            gym: 'YBBF 협회',
            gender: 'm'
          }
        };
        localStorage.setItem('ybbf_mock_session', JSON.stringify(mockAdminUser));
        localStorage.setItem('ybbf_admin_use_mock', 'true');
        return mockAdminUser;
      }
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다. (Mock 계정: admin@ybbf.org / admin1234)');
    }

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

  // 2. 현재 유저 정보 세션 조회
  async getCurrentUser(): Promise<User | null> {
    if (isMockMode()) {
      const saved = localStorage.getItem('ybbf_mock_session');
      if (saved) {
        return JSON.parse(saved);
      }
      return null;
    }

    try {
      const token = localStorage.getItem('session_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/auth/me`, {
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

  // 3. 로그아웃
  async logout(): Promise<void> {
    if (isMockMode()) {
      localStorage.removeItem('ybbf_mock_session');
      localStorage.removeItem('session_token');
      return;
    }

    const token = localStorage.getItem('session_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    localStorage.removeItem('session_token');

    const res = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }
  }
};
