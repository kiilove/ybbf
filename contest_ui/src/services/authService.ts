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

  // 5. 대회 목록 조회 (Firestore contests & contest_notice 컬렉션에서 가져옴, 용인특례시보디빌딩협회 주최 대회 최우선 배치)
  async getContestList(): Promise<SimpleContest[]> {
    try {
      const contestsSnap = await getDocs(collection(db, 'contests'));
      const contestMap = new Map<string, any>();
      contestsSnap.forEach((docSnap) => {
        contestMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      });

      const noticeSnap = await getDocs(collection(db, 'contest_notice'));
      const yonginList: SimpleContest[] = [];
      const otherList: SimpleContest[] = [];
      const seenIds = new Set<string>();

      // 1. contest_notice 기반 탐색
      noticeSnap.forEach((doc) => {
        const data = doc.data();
        const contestId = data.refContestId || doc.id;
        if (!contestId || seenIds.has(contestId)) return;

        const cData = contestMap.get(contestId) || {};
        const promoter = (data.contestPromoter || data.promoter || cData.org || '').trim();
        const title = (data.contestTitle || cData.contestTitle || cData.collectionName || doc.id).trim();

        const isYongin = 
          promoter.includes('용인') || 
          title.includes('용인') || 
          String(cData.org || '').toLowerCase().trim() === 'ybbf' ||
          String(cData.collectionName || '').includes('용인');

        const item = { id: contestId, title };
        seenIds.add(contestId);

        if (isYongin) {
          yonginList.push(item);
        } else {
          otherList.push(item);
        }
      });

      // 2. contests 컬렉션에만 존재하는 대회 추가 탐색
      contestsSnap.forEach((doc) => {
        const contestId = doc.id;
        if (seenIds.has(contestId)) return;

        const cData = doc.data();
        const title = (cData.contestTitle || cData.collectionName || cData.title || doc.id).trim();
        const isYongin = 
          title.includes('용인') || 
          String(cData.org || '').toLowerCase().trim() === 'ybbf' ||
          String(cData.collectionName || '').includes('용인');

        const item = { id: contestId, title };
        seenIds.add(contestId);

        if (isYongin) {
          yonginList.push(item);
        } else {
          otherList.push(item);
        }
      });

      // 용인시 대회 1순위(디폴트) 배치 후, 타 협회 대회 배치
      return [...yonginList, ...otherList];
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

