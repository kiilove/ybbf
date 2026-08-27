import { create } from 'zustand';
import { contestService } from '../services/contestService';
import type { Registration } from '../services/contestService';
import { updateRegistrationPriceCheck } from '../services/priceCheckService';

interface Filters {
  contestId: string;
  keyword: string;
  isPriceCheck: string; // 'all', 'true', 'false'
  isCanceled: string;   // 'all', 'true', 'false'
}

interface ContestState {
  registrations: Registration[];
  isLoading: boolean;
  error: string | null;
  filters: Filters;
  lastSyncedContestId: string | null;
  lastSyncedTime: number;

  // Actions
  fetchList: (forceSync?: boolean, silent?: boolean) => Promise<void>;
  updatePlayerPhotos: (
    registration: Registration, 
    photoUrls: string[], 
    selectedPhotoUrls: string[], 
    stagePhoto1?: string, 
    stagePhoto2?: string
  ) => Promise<void>;
  setFilter: (key: keyof Filters, value: string) => void;
  resetFilters: (defaultContestId?: string) => void;
  togglePaymentStatus: (id: string, isPriceCheck: boolean, sessionUser: any) => Promise<boolean>;
  toggleCancelStatus: (id: string, isCanceled: boolean) => Promise<boolean>;
  saveRegistration: (registration: Registration) => Promise<boolean>;
  deleteRegistration: (id: string) => Promise<boolean>;
  syncFromFirestore: (contestId?: string) => Promise<{ success: boolean; count: number; message: string }>;
  getStats: () => {
    total: number;
    paid: number;
    canceled: number;
    pending: number;
    totalRevenue: number;
    paymentRate: number;
  };
}

export const useContest = create<ContestState>((set, get) => ({
  registrations: [],
  isLoading: false,
  error: null,
  filters: {
    contestId: '',
    keyword: '',
    isPriceCheck: 'all',
    isCanceled: 'all'
  },
  lastSyncedContestId: null,
  lastSyncedTime: 0,

  fetchList: async (forceSync = false, silent = false) => {
    const hasData = get().registrations.length > 0;
    if (!silent && !hasData) {
      set({ isLoading: true, error: null });
    } else {
      set({ error: null });
    }

    try {
      const { filters, lastSyncedContestId, lastSyncedTime } = get();
      const now = Date.now();
      const currentContestId = filters.contestId || 'all';

      // ⚡️ 1분 이내 동기화 이력이 있고 필터만 바꿀 때(forceSync=false)는 Firestore 동기화 건너뛰고 D1 초고속 조회 (약 10ms)
      const isNeedSync = forceSync || (lastSyncedContestId !== currentContestId) || (now - lastSyncedTime > 60 * 1000);

      if (isNeedSync) {
        try {
          await contestService.syncFromFirestore(filters.contestId);
          set({ lastSyncedContestId: currentContestId, lastSyncedTime: now });
        } catch (syncErr) {
          console.warn('자동 Firestore 동기화 경고:', syncErr);
        }
      }

      // 2. 최신 백엔드 명단 로드 (D1 DB 질의)
      const apiFilters = {
        contestId: filters.contestId || undefined,
        keyword: filters.keyword || undefined,
        isPriceCheck: filters.isPriceCheck === 'all' ? undefined : filters.isPriceCheck,
        isCanceled: filters.isCanceled === 'all' ? undefined : filters.isCanceled
      };

      const list = await contestService.fetchRegistrations(apiFilters);
      set({ registrations: list, isLoading: false });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '접수 명단을 불러오는데 실패했습니다.';
      set({ error: errMsg, isLoading: false });
    }
  },

  updatePlayerPhotos: async (
    registration: Registration,
    photoUrls: string[],
    selectedPhotoUrls: string[],
    stagePhoto1?: string,
    stagePhoto2?: string
  ) => {
    const s1 = stagePhoto1 !== undefined ? stagePhoto1 : (selectedPhotoUrls[0] || '');
    const s2 = stagePhoto2 !== undefined ? stagePhoto2 : (selectedPhotoUrls[1] || '');
    const mainPhotoUrl = (s1 && s1.trim() !== '') ? s1 : (s2 || photoUrls[0] || '');

    const updatedRegistration: Registration = {
      ...registration,
      playerPhotoUrl: mainPhotoUrl,
      playerPhotoUrls: photoUrls,
      photos: photoUrls,
      selectedPhotoUrls: [s1, s2],
      stagePhoto1: s1,
      stagePhoto2: s2
    };

    // ⚡️ 1. 즉시 로컬 Zustand 상태 낙관적(Optimistic) 갱신 ➔ 화면 깜빡임/지연 0ms
    set((state) => ({
      registrations: state.registrations.map((r) =>
        r.id === registration.id ? updatedRegistration : r
      )
    }));

    // ⚡️ 2. 백그라운드에서 Firestore & D1 안전 저장
    await contestService.saveRegistration(updatedRegistration);
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value
      }
    }));
    // Trigger fetch after filter updates
    get().fetchList();
  },

  resetFilters: (defaultContestId = '') => {
    set({
      filters: {
        contestId: defaultContestId,
        keyword: '',
        isPriceCheck: 'all',
        isCanceled: 'all'
      }
    });
    get().fetchList();
  },

  togglePaymentStatus: async (id, isPriceCheck, sessionUser) => {
    try {
      const { registrations } = get();
      const invoice = registrations.find((r) => r.id === id);
      if (!invoice) {
        throw new Error('대상을 찾을 수 없습니다.');
      }

      // sessionUser 규격 맞추기
      const formattedSessionUser = {
        userID: sessionUser?.username || 'unknown',
        userGroup: sessionUser?.role || 'staff',
        userContext: sessionUser?.position || '임원',
        id: sessionUser?.uid || 'unknown'
      };

      await updateRegistrationPriceCheck(
        id,
        invoice.playerUid,
        isPriceCheck,
        invoice as any,
        formattedSessionUser,
        invoice.contestId
      );

      // Update local state to reflect change immediately
      set((state) => ({
        registrations: state.registrations.map((r) => 
          r.id === id ? { ...r, isPriceCheck } : r
        )
      }));
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '입금 상태를 변경하지 못했습니다.';
      set({ error: errMsg });
      return false;
    }
  },

  toggleCancelStatus: async (id, isCanceled) => {
    try {
      await contestService.updateCancelStatus(id, isCanceled);
      // Update local state to reflect change immediately
      set((state) => ({
        registrations: state.registrations.map((r) => 
          r.id === id ? { ...r, isCanceled } : r
        )
      }));
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '취소 상태를 변경하지 못했습니다.';
      set({ error: errMsg });
      return false;
    }
  },

  saveRegistration: async (registration) => {
    set({ isLoading: true, error: null });
    try {
      await contestService.saveRegistration(registration);
      set({ isLoading: false });
      get().fetchList();
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '접수 정보를 저장하는데 실패했습니다.';
      set({ error: errMsg, isLoading: false });
      return false;
    }
  },

  deleteRegistration: async (id) => {
    try {
      await contestService.deleteRegistration(id);
      // Remove from local state
      set((state) => ({
        registrations: state.registrations.filter((r) => r.id !== id)
      }));
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '접수 정보를 삭제하지 못했습니다.';
      set({ error: errMsg });
      return false;
    }
  },

  getStats: () => {
    const { registrations } = get();
    const total = registrations.length;
    
    // 입금 확인 건수 (취소된 건 제외)
    const paid = registrations.filter((r) => r.isPriceCheck && !r.isCanceled).length;
    // 취소 건수
    const canceled = registrations.filter((r) => r.isCanceled).length;
    // 대기 건수 (미결제 및 미취소)
    const pending = registrations.filter((r) => !r.isPriceCheck && !r.isCanceled).length;
    
    // 총 매출 (입금 완료된 신청서들의 총 결제 금액 합산)
    const totalRevenue = registrations
      .filter((r) => r.isPriceCheck && !r.isCanceled)
      .reduce((sum, r) => sum + r.contestPriceTotal, 0);

    // 입금 완료 비율 (취소된 인원 제외한 분모)
    const activeTotal = total - canceled;
    const paymentRate = activeTotal > 0 ? Math.round((paid / activeTotal) * 100) : 0;

    return {
      total,
      paid,
      canceled,
      pending,
      totalRevenue,
      paymentRate
    };
  },

  syncFromFirestore: async (contestId) => {
    set({ isLoading: true, error: null });
    try {
      const targetId = contestId || get().filters.contestId;
      const res = await contestService.syncFromFirestore(targetId);
      set({ lastSyncedContestId: targetId || 'all', lastSyncedTime: Date.now() });
      await get().fetchList(false);
      return res;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Firestore 동기화에 실패했습니다.';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  }
}));
