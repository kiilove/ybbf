import { create } from 'zustand';
import { contestService } from '../services/contestService';
import type { PreMeasurement } from '../services/contestService';

interface PreMeasurementState {
  measurements: PreMeasurement[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchMeasurements: (contestId: string) => Promise<void>;
  deleteMeasurement: (id: string) => Promise<boolean>;
}

export const usePreMeasurement = create<PreMeasurementState>((set) => ({
  measurements: [],
  isLoading: false,
  error: null,

  fetchMeasurements: async (contestId) => {
    if (!contestId) {
      set({ measurements: [], error: '대회 ID가 필요합니다.' });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const list = await contestService.fetchPreMeasurements(contestId);
      set({ measurements: list, isLoading: false });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '사전계측 자료를 불러오는데 실패했습니다.';
      set({ error: errMsg, isLoading: false });
    }
  },

  deleteMeasurement: async (id) => {
    try {
      await contestService.deletePreMeasurement(id);
      set((state) => ({
        measurements: state.measurements.filter((m) => m.id !== id)
      }));
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '사전계측 자료를 삭제하지 못했습니다.';
      set({ error: errMsg });
      return false;
    }
  }
}));
