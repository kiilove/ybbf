import { User, UserProfile } from '../types/auth';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4300'}/api`;

function getAuthHeaders(headers: Record<string, string> = {}) {
  const token = localStorage.getItem('session_token');
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
  }
  return headers;
}

// 에러 처리 헬퍼
async function handleResponseError(response: Response) {
  try {
    const data = await response.json();
    return new Error(data.error || 'API 요청 중 알 수 없는 에러가 발생했습니다.');
  } catch {
    return new Error(`서버 요청 실패 (상태 코드: ${response.status})`);
  }
}

export const adminService = {
  // 1. 시스템 설정 조회
  async getSettings(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'GET',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    return await res.json();
  },

  // 2. 시스템 설정 업데이트
  async updateSettings(settings: any): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      credentials: 'include',
      body: JSON.stringify(settings),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return !!data.success;
  },

  // 3. 전체 회원 목록 조회 (관리자 전용)
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      credentials: 'include',
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    return await res.json();
  },

  // 4. 회원 권한(역할군) 변경
  async updateUserRoles(uid: string, roles: string[]): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${uid}/roles`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      credentials: 'include',
      body: JSON.stringify({ roles }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return !!data.success;
  },

  // 5. 회원 삭제 (강제 탈퇴)
  async deleteUser(uid: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${uid}`, {
      method: 'DELETE',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      credentials: 'include',
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return !!data.success;
  },

  // 6. 회원 수동 등록
  async createUser(userData: any): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return !!data.success;
  },
};
