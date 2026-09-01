import { doc, updateDoc, deleteDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export interface JoinItem {
  contestCategoryId: string;
  contestCategoryTitle: string;
  contestGradeId: string;
  contestGradeTitle: string;
  playerNumber?: string | number;
  rank?: number | string;
  award?: string;
  isGrandPrix?: boolean;
}

export interface Registration {
  id: string;
  playerUid: string;
  playerName: string;
  playerGender: 'm' | 'f';
  playerBirth: string;
  playerTel: string;
  playerEmail?: string;
  playerGym: string;
  playerText?: string;
  playerPhotoUrl?: string;
  playerPhotoUrls?: string[];
  photos?: string[];
  playerPhotoUrlsJson?: string;
  selectedPhotoUrls?: string[];
  selectedPhotoUrlsJson?: string;
  stagePhoto1?: string;
  stagePhoto2?: string;
  publicStagePhoto1?: string;
  publicStagePhoto2?: string;
  publicPhotoUrls?: string[];
  publicPhotoUrlsJson?: string;
  playerService: boolean;
  joins: JoinItem[];
  contestPriceSum: number;
  contestPriceTotal: number;
  playerAge?: number | null;
  isPriceCheck: boolean;
  isCanceled: boolean;
  invoiceEdited: boolean;
  createBy: string;
  invoiceCreateAt: string;
  submittedAt: string;
  contestId: string;
  
  // Notice and other fields
  contestTitle?: string;
}

export interface PreMeasurement {
  id: string;
  contestId: string;
  playerUid: string;
  playerName: string;
  playerTel: string;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
}

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:4300'}/api`;

function getAuthHeaders(headers: Record<string, string> = {}) {
  return headers;
}

async function handleResponseError(response: Response) {
  try {
    const data = await response.json();
    return new Error(data.error || 'API 요청 중 오류가 발생했습니다.');
  } catch {
    return new Error(`서버 요청 실패 (상태 코드: ${response.status})`);
  }
}

export const contestService = {
  // 1. 접수 목록 조회 (D1 API 사용)
  async fetchRegistrations(filters: {
    contestId?: string;
    keyword?: string;
    isPriceCheck?: string;
    isCanceled?: string;
  } = {}): Promise<Registration[]> {
    const queryParams = new URLSearchParams();
    if (filters.contestId) queryParams.append('contestId', filters.contestId);
    if (filters.keyword) queryParams.append('keyword', filters.keyword);
    if (filters.isPriceCheck) queryParams.append('isPriceCheck', filters.isPriceCheck);
    if (filters.isCanceled) queryParams.append('isCanceled', filters.isCanceled);

    const res = await fetch(`${API_BASE_URL}/contest/registrations?${queryParams.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders({
        'Content-Type': 'application/json'
      }),
      credentials: 'include'
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    return await res.json();
  },

  // 1-1. Firestore 직접 조회 Fallback (D1 오프라인 또는 네트워크 오류 시 즉시 기동)
  async fetchRegistrationsFromFirestore(contestId?: string): Promise<Registration[]> {
    const invoicesRef = collection(db, 'invoices_pool');
    let q = query(invoicesRef);
    if (contestId && contestId !== 'all') {
      q = query(invoicesRef, where('contestId', '==', contestId));
    }
    const snapshot = await getDocs(q);
    const list: Registration[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let photoUrls: string[] = [];
      if (Array.isArray(data.playerPhotoUrls)) {
        photoUrls = data.playerPhotoUrls;
      } else if (typeof data.playerPhotoUrlsJson === 'string' && data.playerPhotoUrlsJson) {
        try { photoUrls = JSON.parse(data.playerPhotoUrlsJson); } catch (e) {}
      } else if (data.playerPhotoUrl) {
        photoUrls = [data.playerPhotoUrl];
      }

      let selectedUrls: string[] = [];
      if (Array.isArray(data.selectedPhotoUrls)) {
        selectedUrls = data.selectedPhotoUrls;
      } else if (typeof data.selectedPhotoUrlsJson === 'string' && data.selectedPhotoUrlsJson) {
        try { selectedUrls = JSON.parse(data.selectedPhotoUrlsJson); } catch (e) {}
      }

      const stagePhoto1 = data.stagePhoto1 || selectedUrls[0] || '';
      const stagePhoto2 = data.stagePhoto2 || selectedUrls[1] || '';

      list.push({
        id: docSnap.id,
        playerUid: data.playerUid || docSnap.id,
        playerName: data.playerName || '이름 없음',
        playerGender: data.playerGender || 'm',
        playerBirth: data.playerBirth || '',
        playerTel: data.playerTel || '',
        playerEmail: data.playerEmail || '',
        playerGym: data.playerGym || '',
        playerText: data.playerText || '',
        playerPhotoUrl: stagePhoto1 || stagePhoto2 || photoUrls[0] || '',
        playerPhotoUrls: photoUrls,
        photos: photoUrls,
        selectedPhotoUrls: [stagePhoto1, stagePhoto2],
        stagePhoto1,
        stagePhoto2,
        publicStagePhoto1: data.publicStagePhoto1 || '',
        publicStagePhoto2: data.publicStagePhoto2 || '',
        publicPhotoUrls: Array.isArray(data.publicPhotoUrls) ? data.publicPhotoUrls : [],
        playerService: Boolean(data.playerService),
        joins: Array.isArray(data.joins) ? data.joins : [],
        contestPriceSum: data.contestPriceSum || 0,
        contestPriceTotal: data.contestPriceTotal || 0,
        isPriceCheck: Boolean(data.isPriceCheck),
        isCanceled: Boolean(data.isCanceled),
        invoiceEdited: Boolean(data.invoiceEdited),
        createBy: data.createBy || '',
        invoiceCreateAt: data.invoiceCreateAt || '',
        submittedAt: data.submittedAt || '',
        contestId: data.contestId || ''
      });
    });

    return list;
  },

  // 2. 입금 확인 여부 수정 (D1 + Firestore 동시 업데이트)
  async updatePaymentStatus(id: string, isPriceCheck: boolean): Promise<void> {
    // [A] D1 업데이트
    const res = await fetch(`${API_BASE_URL}/contest/registrations/${id}/check`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json'
      }),
      credentials: 'include',
      body: JSON.stringify({ isPriceCheck })
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    // [B] Firestore 업데이트
    try {
      const docRef = doc(db, 'invoices_pool', id);
      await updateDoc(docRef, { isPriceCheck });
    } catch (err) {
      console.error('Firestore 입금 확인 상태 동기화 실패:', err);
    }
  },

  // 3. 접수 취소 상태 수정 (D1 + Firestore 동시 업데이트)
  async updateCancelStatus(id: string, isCanceled: boolean): Promise<void> {
    // [A] D1 업데이트
    const res = await fetch(`${API_BASE_URL}/contest/registrations/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json'
      }),
      credentials: 'include',
      body: JSON.stringify({ isCanceled })
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    // [B] Firestore 업데이트
    try {
      const docRef = doc(db, 'invoices_pool', id);
      await updateDoc(docRef, { isCanceled });
    } catch (err) {
      console.error('Firestore 접수 취소 상태 동기화 실패:', err);
    }
  },

  // 4. 접수 정보 수정 및 신규 등록 (Firestore 및 D1 Sync)
  async saveRegistration(registration: Registration): Promise<void> {
    // [A] Firestore 저장
    const rawPhotos = registration.photos || registration.playerPhotoUrls || (registration.playerPhotoUrl ? [registration.playerPhotoUrl] : []);
    const playerPhotoUrls = Array.from(new Set(rawPhotos.filter(Boolean)));
    const stagePhoto1 = registration.stagePhoto1 || registration.selectedPhotoUrls?.[0] || '';
    const stagePhoto2 = registration.stagePhoto2 || registration.selectedPhotoUrls?.[1] || '';
    const selectedPhotoUrls = [stagePhoto1, stagePhoto2];
    const mainPhotoUrl = stagePhoto1 || stagePhoto2 || playerPhotoUrls[0] || '';

    const finalFirestorePayload: Registration & {
      invoiceEdited: boolean;
      invoiceEditAt: string;
      playerPhotoUrlsJson?: string;
      selectedPhotoUrlsJson?: string;
      publicPhotoUrlsJson?: string;
    } = { 
      ...registration,
      playerPhotoUrl: mainPhotoUrl,
      playerPhotoUrls,
      photos: playerPhotoUrls,
      selectedPhotoUrls,
      stagePhoto1,
      stagePhoto2,
      publicStagePhoto1: registration.publicStagePhoto1 || '',
      publicStagePhoto2: registration.publicStagePhoto2 || '',
      publicPhotoUrls: registration.publicPhotoUrls || [],
      invoiceEdited: true,
      invoiceEditAt: new Date().toISOString()
    };
    if (playerPhotoUrls && playerPhotoUrls.length > 0) {
      finalFirestorePayload.playerPhotoUrlsJson = JSON.stringify(playerPhotoUrls);
    }
    if (selectedPhotoUrls && selectedPhotoUrls.length > 0) {
      finalFirestorePayload.selectedPhotoUrlsJson = JSON.stringify(selectedPhotoUrls);
    }
    if (registration.publicPhotoUrls && registration.publicPhotoUrls.length > 0) {
      finalFirestorePayload.publicPhotoUrlsJson = JSON.stringify(registration.publicPhotoUrls);
    }
    
    const docId = (registration.id || registration.playerUid || (registration as any).docId || (registration as any).invoiceId || '').trim();
    if (!docId) {
      console.error('❌ 유효하지 않은 선수 문서 ID:', registration);
      throw new Error(`선수 문서 ID가 유효하지 않습니다. (선수명: ${registration.playerName || '이름없음'})`);
    }

    finalFirestorePayload.id = docId;
    finalFirestorePayload.playerUid = registration.playerUid || docId;

    const docRef = doc(db, 'invoices_pool', docId);
    await setDoc(docRef, finalFirestorePayload, { merge: true });

    // [B] D1 동기화 (기존의 /api/register 또는 PUT API 활용)
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(finalFirestorePayload)
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        console.warn(`[D1 Sync Warning] D1 응답 상태: ${res.status} - ${errorText}`);
      }
    } catch (d1Err) {
      console.warn('D1 네트워크 동기화 경고 (Firestore는 정상 저장됨):', d1Err);
    }
  },

  // 4-1. 선수 사진 목록 및 선택된 사진 업데이트 전용 메서드
  async updatePlayerPhotos(
    registration: Registration, 
    photoUrls: string[], 
    selectedPhotoUrls: string[],
    stagePhoto1?: string,
    stagePhoto2?: string
  ): Promise<void> {
    const s1 = stagePhoto1 !== undefined ? stagePhoto1 : (selectedPhotoUrls[0] || '');
    const s2 = stagePhoto2 !== undefined ? stagePhoto2 : (selectedPhotoUrls[1] || '');
    const mainPhotoUrl = (s1 && s1.trim() !== '') 
      ? s1 
      : (s2 || photoUrls[0] || '');

    const updatedRegistration: Registration = {
      ...registration,
      playerPhotoUrl: mainPhotoUrl,
      playerPhotoUrls: photoUrls,
      photos: photoUrls,
      selectedPhotoUrls: [s1, s2],
      stagePhoto1: s1,
      stagePhoto2: s2
    };

    await this.saveRegistration(updatedRegistration);
  },

  // 5. 접수 정보 완전 삭제 (Firestore 및 D1 Sync)
  async deleteRegistration(id: string): Promise<void> {
    // [A] Firestore에서 삭제
    try {
      await deleteDoc(doc(db, 'invoices_pool', id));
    } catch (err) {
      console.error('Firestore 접수 삭제 오류:', err);
    }

    // [B] D1에서 삭제 (관리자 전용 삭제 API 활용)
    const res = await fetch(`${API_BASE_URL}/admin/invoices/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) {
      // 만약 토큰 만료 또는 권한 미달(스태프 권한)로 실패하더라도 Firestore가 지워졌으므로 클라이언트에 경고만 남김
      console.warn('D1 접수 내역 삭제 실패 (권한 제한일 수 있음):', res.status);
    }
  },

  // 6. 사전계측 자료 전체 목록 조회 (특정 대회 필터링)
  async fetchPreMeasurements(contestId: string): Promise<PreMeasurement[]> {
    const res = await fetch(`${API_BASE_URL}/admin/pre-measurement/list?contestId=${encodeURIComponent(contestId)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    return await res.json();
  },

  // 7. 사전계측 자료 단일 레코드 삭제
  async deletePreMeasurement(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/pre-measurement/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }
  },

  // 8. Firestore 기준 ➔ Cloudflare D1 데이터 동기화
  async syncFromFirestore(contestId?: string): Promise<{ success: boolean; count: number; message: string }> {
    const invoicesRef = collection(db, 'invoices_pool');
    let q = query(invoicesRef);
    if (contestId) {
      q = query(invoicesRef, where('contestId', '==', contestId));
    }
    const querySnapshot = await getDocs(q);
    const invoices: any[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // 사진 목록 안전 가공
      let photoUrls: string[] = [];
      if (Array.isArray(data.playerPhotoUrls)) {
        photoUrls = data.playerPhotoUrls;
      } else if (typeof data.playerPhotoUrlsJson === 'string' && data.playerPhotoUrlsJson) {
        try { photoUrls = JSON.parse(data.playerPhotoUrlsJson); } catch (e) {}
      } else if (typeof data.playerPhotoUrls === 'string' && data.playerPhotoUrls) {
        try { photoUrls = JSON.parse(data.playerPhotoUrls); } catch (e) {}
      }
      if (photoUrls.length === 0 && data.playerPhotoUrl) {
        photoUrls = [data.playerPhotoUrl];
      }

      let selectedUrls: string[] = [];
      if (Array.isArray(data.selectedPhotoUrls)) {
        selectedUrls = data.selectedPhotoUrls;
      } else if (typeof data.selectedPhotoUrlsJson === 'string' && data.selectedPhotoUrlsJson) {
        try { selectedUrls = JSON.parse(data.selectedPhotoUrlsJson); } catch (e) {}
      } else if (typeof data.selectedPhotoUrls === 'string' && data.selectedPhotoUrls) {
        try { selectedUrls = JSON.parse(data.selectedPhotoUrls); } catch (e) {}
      }

      invoices.push({
        id: docSnap.id,
        ...data,
        playerPhotoUrls: photoUrls,
        selectedPhotoUrls: selectedUrls
      });
    });

    if (invoices.length === 0) {
      return { success: true, count: 0, message: '동기화할 Firestore 접수 데이터가 없습니다.' };
    }

    const res = await fetch(`${API_BASE_URL}/contest/sync-from-firestore`, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json'
      }),
      credentials: 'include',
      body: JSON.stringify({ invoices })
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const result = await res.json();
    return result;
  },

  // 선수 출전 종목별 성적/순위 업데이트
  async updatePlayerJoinResults(
    invoiceId: string, 
    joins: JoinItem[], 
    overallAward?: string
  ): Promise<void> {
    const docRef = doc(db, 'invoices_pool', invoiceId);
    const payload: any = { joins };
    if (overallAward !== undefined) {
      payload.award = overallAward;
      if (overallAward.includes('그랑프리') || overallAward.includes('우승')) {
        payload.isGrandPrix = true;
        payload.rank = 1;
      }
    }
    await updateDoc(docRef, payload);
  }
};
