/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import type { User, SystemSettings, UserRole, MediaItem, ContestStaff, StaffStatus } from '../types/auth';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:4300'}/api`;
const MEDIA_API_BASE_URL = `${import.meta.env.VITE_MEDIA_API_URL || 'http://localhost:4400'}/api`;

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

// 에러 객체 생성 헬퍼
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
  async fetchSystemSettings(): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    return await res.json();
  },

  // 2. 시스템 설정 업데이트
  async updateSystemSettings(settings: SystemSettings): Promise<void> {
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
  },

  // 3. 전체 회원 목록 조회
  async fetchAdminUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    return await res.json();
  },

  // 4. 회원 역할군(권한) 변경
  async updateUserRoles(uid: string, roles: UserRole[]): Promise<void> {
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
  },

  // 5. 회원 강제 삭제
  async deleteUser(uid: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/users/${uid}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }
  },

  // 6. 신규 사용자/관리자 수동 등록
  async createAdminUser(payload: {
    email: string;
    password?: string;
    roles: UserRole[];
    profile?: {
      name: string;
      birth: string;
      tel: string;
      gym: string;
      gender: 'm' | 'f' | '';
    };
  }): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }
  },

  // 7. 이미지 업로드 (Cloudflare R2)
  async uploadImage(file: File, playerUid: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('playerUid', playerUid);

    const res = await fetch(`${MEDIA_API_BASE_URL}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: formData,
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return data.url;
  },

  // 8. 미디어 목록 조회
  async fetchMediaList(category?: string): Promise<MediaItem[]> {
    const url = new URL(`${MEDIA_API_BASE_URL}/media`);
    if (category && category !== 'all') {
      url.searchParams.append('category', category);
    }
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw await handleResponseError(res);
    }
    return await res.json();
  },

  // 9. 미디어 등록
  async createMedia(payload: {
    id: string;
    title: string;
    category: string;
    thumbnail: string;
    videoUrl?: string;
    youtubeUrl?: string;
    date: string;
    description: string;
    featured?: boolean;
    relatedLegendIds?: string[];
    sortOrder?: number;
  }): Promise<void> {
    const res = await fetch(`${MEDIA_API_BASE_URL}/admin/media`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw await handleResponseError(res);
    }
  },

  // 10. 미디어 수정
  async updateMedia(id: string, payload: {
    title: string;
    category: string;
    thumbnail: string;
    videoUrl?: string;
    youtubeUrl?: string;
    date: string;
    description: string;
    featured?: boolean;
    relatedLegendIds?: string[];
    sortOrder?: number;
  }): Promise<void> {
    const res = await fetch(`${MEDIA_API_BASE_URL}/admin/media/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw await handleResponseError(res);
    }
  },

  // 11. 미디어 삭제
  async deleteMedia(id: string): Promise<void> {
    const res = await fetch(`${MEDIA_API_BASE_URL}/admin/media/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw await handleResponseError(res);
    }
  },

  // 12. 사이트 섹션 조회
  async fetchSections(page?: string): Promise<any[]> {
    const url = new URL(`${API_BASE_URL}/landing/sections`);
    if (page) url.searchParams.append('page', page);
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },

  // 13. 사이트 섹션 업데이트
  async updateSection(sectionId: string, payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/landing/sections/${sectionId}`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 14. 협회 연맹/지부 조회
  async fetchAffiliations(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/about/affiliations`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },

  // 15. 협회 연맹/지부 등록
  async createAffiliation(payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/about/affiliations`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 16. 협회 연맹/지부 수정
  async updateAffiliation(id: string, payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/about/affiliations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 17. 협회 연맹/지부 삭제
  async deleteAffiliation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/about/affiliations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 18. 스폰서 목록 조회
  async fetchSponsors(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/landing/sponsors`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },

  // 19. 스폰서 등록
  async createSponsor(payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/landing/sponsors`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 20. 스폰서 수정
  async updateSponsor(id: string, payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/landing/sponsors/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 21. 스폰서 삭제
  async deleteSponsor(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/landing/sponsors/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 22. 소셜 피드 조회
  async fetchSocials(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/landing/socials`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },

  // 23. 소셜 피드 등록
  async createSocial(payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/landing/socials`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 24. 소셜 피드 수정
  async updateSocial(id: string, payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/landing/socials/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 25. 소셜 피드 삭제
  async deleteSocial(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/landing/socials/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 26. 레전드 목록 조회
  async fetchLegendsList(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/legends`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },

  // 27. 레전드 등록
  async createLegend(payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/legends`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 28. 레전드 수정
  async updateLegend(id: string, payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/legends/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 29. 레전드 삭제
  async deleteLegend(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/legends/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 30. 레전드 타이틀 추가
  async createLegendTitle(legendId: string, payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/legends/${legendId}/titles`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 31. 레전드 타이틀 삭제
  async deleteLegendTitle(legendId: string, titleId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/legends/${legendId}/titles/${titleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 32. 레전드 갤러리 이미지 추가
  async createLegendGallery(legendId: string, imageUrl: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/legends/${legendId}/gallery`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ imageUrl }),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 33. 레전드 갤러리 이미지 삭제
  async deleteLegendGallery(legendId: string, galleryId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/legends/${legendId}/gallery/${galleryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 34. 유스 클럽 목록 조회
  async fetchYouthClubs(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/youth/clubs`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },

  // 35. 유스 클럽 등록
  async createYouthClub(payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/youth/clubs`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 36. 유스 클럽 수정
  async updateYouthClub(id: string, payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/youth/clubs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 37. 유스 클럽 삭제
  async deleteYouthClub(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/youth/clubs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 38. 유스 선수 목록 조회
  async fetchYouthAthletes(): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/youth/athletes`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },

  // 39. 유스 선수 등록
  async createYouthAthlete(payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/youth/athletes`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 40. 유스 선수 수정
  async updateYouthAthlete(id: string, payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/youth/athletes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 41. 유스 선수 삭제
  async deleteYouthAthlete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/youth/athletes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 42. 유스 선수 수상경력 추가
  async createYouthAchievement(athleteId: string, achievement: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/youth/athletes/${athleteId}/achievements`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ achievement }),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 43. 유스 선수 수상경력 삭제
  async deleteYouthAchievement(athleteId: string, achievement: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/youth/athletes/${athleteId}/achievements`, {
      method: 'DELETE',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ achievement }),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 44. 공지사항 전체 목록 조회
  async fetchNotices(mandatoryOnly?: boolean): Promise<any[]> {
    const url = new URL(`${API_BASE_URL}/notices`);
    if (mandatoryOnly) {
      url.searchParams.append('mandatory', 'true');
    }
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },

  // 45. 공지사항 상세 조회
  async fetchNoticeDetail(id: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/notices/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },

  // 46. 신규 공지사항 생성
  async createNotice(payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/notices`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 47. 기존 공지사항 수정
  async updateNotice(id: string, payload: any): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/notices/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 48. 공지사항 삭제
  async deleteNotice(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/notices/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw await handleResponseError(res);
  },

  // 49. 공지사항 리소스 파일 R2 업로드
  async uploadNoticeFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'notices');

    const res = await fetch(`${MEDIA_API_BASE_URL}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) throw await handleResponseError(res);
    const data = await res.json();
    return data.url;
  },

  // 50. 대회 관계자 계정 목록 조회
  async fetchContestStaffs(params?: { keyword?: string; status?: string; role?: string }): Promise<{ success: boolean; total: number; staffs: ContestStaff[] }> {
    const url = new URL(`${API_BASE_URL}/admin/contest-staffs`);
    if (params?.keyword) url.searchParams.append('keyword', params.keyword);
    if (params?.status && params.status !== 'all') url.searchParams.append('status', params.status);
    if (params?.role && params.role !== 'all') url.searchParams.append('role', params.role);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },

  // 51. 신규 대회 관계자 계정 생성
  async createContestStaff(payload: Partial<ContestStaff> & { password?: string }): Promise<{ success: boolean; message: string; uid: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/contest-staffs`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },

  // 52. 대회 관계자 계정 정보 수정
  async updateContestStaff(uid: string, payload: Partial<ContestStaff>): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/contest-staffs/${uid}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },

  // 53. 대회 관계자 계정 상태 변경 (활성화/비활성화/승인)
  async updateContestStaffStatus(uid: string, status: StaffStatus): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/contest-staffs/${uid}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },

  // 54. 대회 관계자 비밀번호 초기화
  async resetContestStaffPassword(uid: string, newPassword?: string): Promise<{ success: boolean; message: string; tempPassword?: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/contest-staffs/${uid}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },

  // 55. 대회 관계자 계정 삭제
  async deleteContestStaff(uid: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/contest-staffs/${uid}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  }
};

