import { User, UserProfile } from '../types/auth';

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

export const authService = {
  // 1. 회원가입
  async signUp(email: string, password: string): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
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

  // 2. 이메일 로그인
  async login(email: string, password: string): Promise<User> {
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

  // 3. 소셜 로그인
  async loginSocial(provider: 'google' | 'naver' | 'kakao'): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/login/social`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

  // 4. 현재 유저 정보 세션 조회
  async getCurrentUser(): Promise<User | null> {
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

    const res = await fetch(`${API_BASE_URL}/auth/logout`, {
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

    const res = await fetch(`${API_BASE_URL}/auth/additional-info`, {
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
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const res = await fetch(`${API_BASE_URL}/auth/find-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name, tel }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return { email: data.email, createdAt: data.createdAt };
  },

  // 10. 비밀번호 변경 (로그인된 상태)
  async changePassword(uid: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ uid, currentPassword, newPassword }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return !!data.success;
  },

  // 11. 프로필 정보(닉네임, 실명, 프로필사진, 연락처, 체육관 등) 수정
  async updateProfile(uid: string, profile: UserProfile): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        uid,
        name: profile.name,
        nickname: profile.nickname,
        birth: profile.birth,
        tel: profile.tel,
        gym: profile.gym,
        gender: profile.gender,
        profilePhotoUrl: profile.profilePhotoUrl,
      }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return !!data.success;
  },

  // 12. 닉네임 변경 이력 (언제, 누가, 어떻게) 조회
  async getNicknameHistory(uid: string): Promise<{ id: number; uid: string; nickname: string; changeReason: string; changedBy: string; createdAt: string }[]> {
    const res = await fetch(`${API_BASE_URL}/user/nickname-history?uid=${encodeURIComponent(uid)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    return await res.json();
  },

  // 12. 이메일 중복 체크
  async checkEmail(email: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/auth/check-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return !!data.exists; // true 이면 중복(존재함), false 이면 미중복(사용 가능)
  },
};
