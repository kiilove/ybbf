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
  heroPlayers?: any[];
  
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
  heroName: "KANG SEUNG-MIN",
  heroClass: "일반부 보디빌딩 (오버롤)",
  heroHeight: "178",
  heroWeight: "85",
  heroGym: "무소속",
  heroTitles: "2026 제9회 용인특례시 보디빌딩대회 일반부 보디빌딩 오버롤 그랑프리 챔피언",
  heroImageUrl: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973711190_Athlete_striking_side_chest_pose_202608291221.jpeg",
  heroInstagram: "#",
  heroYoutube: "#",
  heroFacebook: "#",
  heroPlayers: [
    {
      id: 'hero-gp-kang-seung-min',
      heroName: '강승민',
      heroClass: '일반부 보디빌딩 (오버롤)',
      heroHeight: '174',
      heroWeight: '87.56',
      heroConditioning: '99.9',
      heroGym: '무소속',
      heroTitles: '2026 제9회 용인특례시 보디빌딩대회 일반부 보디빌딩 오버롤 그랑프리 챔피언',
      stagePhoto1: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973711190_Athlete_striking_side_chest_pose_202608291221.jpeg',
      stagePhoto2: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973719285_Athlete_striking_bicep_pose_202608291221.jpeg',
      heroImageUrl: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973711190_Athlete_striking_side_chest_pose_202608291221.jpeg',
      heroInstagram: '#',
      heroYoutube: '#',
      heroFacebook: '#'
    },
    {
      id: 'hero-gp-kim-min-kyeong',
      heroName: '김민경',
      heroClass: '비키니 & 스포츠모델 (2관왕)',
      heroHeight: '',
      heroWeight: '',
      heroConditioning: '99.5',
      heroGym: '단단짐',
      heroTitles: '2026 제9회 용인특례시 보디빌딩대회 비키니 & 스포츠모델 오버롤 2관왕 그랑프리',
      stagePhoto1: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_0eee94b4-a403-4376-bf39-1d192c790e1a/1787805097349_Female_athlete_posing_with_skate…_202608271331.jpeg',
      stagePhoto2: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_0eee94b4-a403-4376-bf39-1d192c790e1a/1787805673713_Athlete_holding_skateboard_2K_202608271340.jpeg',
      heroImageUrl: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_0eee94b4-a403-4376-bf39-1d192c790e1a/1787805097349_Female_athlete_posing_with_skate…_202608271331.jpeg',
      heroInstagram: '#',
      heroYoutube: '#',
      heroFacebook: '#'
    },
    {
      id: 'hero-gp-yoo-yong-soo',
      heroName: '유용수',
      heroClass: '클래식 보디빌딩 (오버롤)',
      heroHeight: '170',
      heroWeight: '69.9',
      heroConditioning: '99.2',
      heroGym: '피트니스 유 짐',
      heroTitles: '2026 제9회 용인특례시 보디빌딩대회 클래식 보디빌딩 오버롤 그랑프리 챔피언',
      stagePhoto1: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_a8fc9bfd-da91-4491-973c-e8373f727dea/1787973297495_Athlete_striking_side_chest_pose_202608291214.jpeg',
      stagePhoto2: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_a8fc9bfd-da91-4491-973c-e8373f727dea/1787973305284_Athlete_striking_bicep_pose_202608291214.jpeg',
      heroImageUrl: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_a8fc9bfd-da91-4491-973c-e8373f727dea/1787973297495_Athlete_striking_side_chest_pose_202608291214.jpeg',
      heroInstagram: '#',
      heroYoutube: '#',
      heroFacebook: '#'
    },
    {
      id: 'hero-gp-kim-gwang-hyun',
      heroName: '김광현',
      heroClass: '마스터즈 보디빌딩 (오버롤)',
      heroHeight: '',
      heroWeight: '',
      heroConditioning: '99.0',
      heroGym: '그린헬스',
      heroTitles: '2026 제9회 용인특례시 보디빌딩대회 마스터즈(장년부) 보디빌딩 오버롤 그랑프리',
      stagePhoto1: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_e610d371-0e7f-4eac-8bc1-cc0a092e892c/1787799278717_Muscular_man_performing_bicep_pose_202608271143.jpeg',
      stagePhoto2: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_e610d371-0e7f-4eac-8bc1-cc0a092e892c/1787799286857_Muscular_man_flexing_abs_2K_202608271143.jpeg',
      heroImageUrl: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_e610d371-0e7f-4eac-8bc1-cc0a092e892c/1787799278717_Muscular_man_performing_bicep_pose_202608271143.jpeg',
      heroInstagram: '#',
      heroYoutube: '#',
      heroFacebook: '#'
    },
    {
      id: 'hero-gp-oh-geun-seok',
      heroName: '오근석',
      heroClass: '남자 스포츠 모델 (오버롤)',
      heroHeight: '175',
      heroWeight: '',
      heroConditioning: '98.8',
      heroGym: '피트니스 유 짐',
      heroTitles: '2026 제9회 용인특례시 보디빌딩대회 남자 스포츠 모델 오버롤 그랑프리',
      stagePhoto1: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_8f3d6fe5-88bf-4054-94bb-96be27787dd2/1787805178652_Fit_man_with_skateboard_202608271332.jpeg',
      stagePhoto2: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_8f3d6fe5-88bf-4054-94bb-96be27787dd2/1787805686036_Athletic_man_holding_skateboard_2K_202608271340.jpeg',
      heroImageUrl: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_8f3d6fe5-88bf-4054-94bb-96be27787dd2/1787805178652_Fit_man_with_skateboard_202608271332.jpeg',
      heroInstagram: '#',
      heroYoutube: '#',
      heroFacebook: '#'
    },
    {
      id: 'hero-gp-han-soo-man',
      heroName: '한수만',
      heroClass: '남자 학생부 보디빌딩 (오버롤)',
      heroHeight: '173',
      heroWeight: '',
      heroConditioning: '98.5',
      heroGym: '마들짐',
      heroTitles: '2026 제9회 용인특례시 보디빌딩대회 남자 학생부 보디빌딩 그랑프리',
      stagePhoto1: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_378efcf0-6e46-4cb4-a15d-d9bca1b4a098/1787973809633_Athlete_striking_side_chest_pose_202608291223.jpeg',
      stagePhoto2: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_378efcf0-6e46-4cb4-a15d-d9bca1b4a098/1787973816654_Athlete_striking_bicep_pose_202608291223.jpeg',
      heroImageUrl: 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_378efcf0-6e46-4cb4-a15d-d9bca1b4a098/1787973809633_Athlete_striking_side_chest_pose_202608291223.jpeg',
      heroInstagram: '#',
      heroYoutube: '#',
      heroFacebook: '#'
    }
  ],
  competitionPhase: "RESULT",
  competitionTitle: "제9회 용인특례시 보디빌딩대회",
  competitionDate: "2026. 08. 29",
  competitionVenue: "용인특례시 실내체육관 특설무대",
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
