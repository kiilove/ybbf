import { create } from 'zustand';
import { adminService } from '../services/adminService';

export interface SystemSettings {
  heroName: string;
  heroClass: string;
  heroHeight: string;
  heroWeight: string;
  heroGym: string;
  heroTitles: string;
  heroImageUrl: string;
  heroInstagram: string;
  heroYoutube: string;
  heroFacebook: string;
  
  competitionPhase: 'UPCOMING' | 'REGISTRATION' | 'CLOSED' | 'LIVE' | 'RESULT';
  competitionTitle: string;
  competitionDate: string;
  competitionVenue: string;
  competitionBankName: string;
  competitionAccountNumber: string;
  competitionAccountOwner: string;
  competitionPriceBasic: number;
  competitionPriceExtra: number;
}

interface SettingsState {
  settings: SystemSettings;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: SystemSettings) => Promise<boolean>;
  setLocalSettings: (newSettings: SystemSettings) => void;
}

const DEFAULT_SETTINGS: SystemSettings = {
  heroName: "KIM CHAMPION",
  heroClass: "CLASSIC PHYSIQUE",
  heroHeight: "182",
  heroWeight: "95",
  heroGym: "용인시 보디빌딩협회",
  heroTitles: "2026 Overall Winner · 2025 Grand Prix 1st · Mr. Yongin 3× Champion",
  heroImageUrl: "/hero_section.png",
  heroInstagram: "#",
  heroYoutube: "#",
  heroFacebook: "#",
  competitionPhase: "LIVE",
  competitionTitle: "2026 YBBF CHAMPIONSHIP",
  competitionDate: "2026. 10. 15",
  competitionVenue: "용인시 실내체육관 특설무대",
  competitionBankName: "우리은행",
  competitionAccountNumber: "1002-250-33892",
  competitionAccountOwner: "정태천(용인시보디빌딩협회)",
  competitionPriceBasic: 80000,
  competitionPriceExtra: 30000,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await adminService.getSettings();
      set({ settings: data, isLoading: false });
    } catch (err: any) {
      console.warn('설정 조회 실패 (디폴트 설정으로 동작):', err);
      // API 조회 실패 시에도 기본값(DEFAULT_SETTINGS)을 유지하여 UI가 정상 동작하도록 함
      set({ settings: DEFAULT_SETTINGS, isLoading: false });
    }
  },

  updateSettings: async (newSettings: SystemSettings) => {
    set({ isLoading: true, error: null });
    try {
      const success = await adminService.updateSettings(newSettings);
      if (success) {
        set({ settings: newSettings, isLoading: false });
        return true;
      }
      throw new Error('설정 저장 응답 실패');
    } catch (err: any) {
      set({ error: err.message || '설정 저장 중 오류가 발생했습니다.', isLoading: false });
      return false;
    }
  },

  setLocalSettings: (newSettings: SystemSettings) => {
    set({ settings: newSettings });
  },
}));
