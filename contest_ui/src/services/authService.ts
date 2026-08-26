import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface Staff {
  uid: string;
  username: string;
  name: string;
  role: 'staff' | 'admin';
  contestId?: string;
  phone?: string;
  email?: string;
  position?: string;
  isReferee?: number; // 0: 미보유, 1: 보유
  refereeGrade?: string; // 심판 급수/자격상세
  profilePhotoUrl?: string;
  businessIntro?: string;
  snsLinks?: {
    instagram?: string;
    youtube?: string;
    [key: string]: string | undefined;
  };
}

export interface SimpleContest {
  id: string;
  title: string;
}

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:4300'}/api/contest/auth`;

async function handleResponseError(response: Response) {
  try {
    const data = await response.json();
    return new Error(data.error || 'API 요청 중 오류가 발생했습니다.');
  } catch {
    return new Error(`서버 요청 실패 (상태 코드: ${response.status})`);
  }
}


export const authService = {
  // 1. 관계자 회원가입
  async signup(
    username: string,
    password: string,
    name: string,
    phone?: string,
    email?: string,
    position?: string,
    isReferee?: number,
    refereeGrade?: string
  ): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password, name, phone, email, position, isReferee, refereeGrade }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }
  },

  // 2. 관계자 로그인
  async login(username: string, password: string): Promise<Staff> {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return data.staff;
  },

  // 3. 관계자 세션 정보 확인
  async getCurrentStaff(): Promise<Staff | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      return data;
    } catch (err) {
      console.error('getCurrentStaff error:', err);
      return null;
    }
  },

  // 4. 관계자 로그아웃
  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
    } catch (err) {
      console.error('logout API error:', err);
    }
  },

  // 5. 대회 목록 조회 (Firestore contest_notice 컬렉션에서 가져옴, 용인특례시보디빌딩협회 주최 & 접수중인 대회만 필터링)
  async getContestList(): Promise<SimpleContest[]> {
    try {
      // 1. contests 컬렉션에서 진행/접수 중인(isCompleted === false) 대회 ID 수집
      const contestSnap = await getDocs(collection(db, 'contests'));
      const activeContestIds = new Set<string>();
      contestSnap.forEach((doc) => {
        const data = doc.data();
        if (data.isCompleted === false) {
          activeContestIds.add(doc.id);
        }
      });

      // 2. contest_notice 컬렉션에서 위 수집된 대회 ID에 해당하는 공고 중 주최(contestPromoter)가 '용인특례시보디빌딩협회' 또는 '용인' 포함된 공고만 필터링
      const querySnapshot = await getDocs(collection(db, 'contest_notice'));
      const list: SimpleContest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const promoter = (data.contestPromoter || data.promoter || '').trim();
        const title = (data.contestTitle || doc.id).trim();

        // 용인특례시보디빌딩협회 주최 또는 대회 제목에 '용인'이 포함된 접수 중 대회 필터링
        const isYonginContest = promoter.includes('용인') || title.includes('용인') || promoter.length === 0;

        if (data.refContestId && activeContestIds.has(data.refContestId) && isYonginContest) {
          list.push({
            id: data.refContestId,
            title: title
          });
        }
      });

      // 만약 용인 전용 필터링 건이 없으면 activeContestIds 대상 전체 반환 (폴백)
      if (list.length === 0 && activeContestIds.size > 0) {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.refContestId && activeContestIds.has(data.refContestId)) {
            list.push({
              id: data.refContestId,
              title: data.contestTitle || doc.id
            });
          }
        });
      }

      return list;
    } catch (err) {
      console.error('getContestList error:', err);
      return [];
    }
  },

  // 6. 관계자 아이디 중복 체크
  async checkUsername(username: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/check-username?username=${encodeURIComponent(username.trim())}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return !!data.available;
  },

  // 7. 관계자 프로필 정보 수정 및 추가 등록
  async saveAdditionalInfo(
    username: string,
    profilePhotoUrl?: string,
    businessIntro?: string,
    snsLinks?: { instagram?: string; youtube?: string; [key: string]: string | undefined },
    name?: string,
    position?: string,
    isReferee?: boolean,
    refereeGrade?: string
  ): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/additional-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ 
        username, 
        profilePhotoUrl, 
        businessIntro, 
        snsLinks,
        name,
        position,
        isReferee,
        refereeGrade
      }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }
  },

  // 8. 관계자 비밀번호 확인 (Verify Password)
  async verifyPassword(password: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/verify-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return !!data.success;
  },

  // 9. 관계자 비밀번호 변경 (Change Password)
  async changePassword(newPassword: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ newPassword }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return !!data.success;
  }
};

