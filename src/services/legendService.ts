import { contestArchiveService } from './contestArchiveService';

export interface ChampionWinner {
  id: string;
  name: string;
  nameEn: string;
  number?: string | number | null;
  gym: string;
  height?: string | number | null;
  weight?: string | number | null;
  stagePhoto1?: string;
  stagePhoto2?: string;
  photoUrl: string;
  isGrandPrix: boolean;
  edition?: number;
  categories: {
    categoryTitle: string;
    gradeTitle: string;
    isOverall: boolean;
    award: string;
  }[];
}

export interface LegendItem {
  id: string;
  name: string;
  nameEn: string;
  number?: string | number | null;
  gym?: string;
  club?: string;
  height?: string | number | null;
  weight?: string | number | null;
  stagePhoto1?: string;
  stagePhoto2?: string;
  profileImage: string;
  class: string;
  isGrandPrix: boolean;
  edition?: number;
  quote?: string;
  bio?: string;
  titles?: {
    year: number;
    competition: string;
    result: string;
    class: string;
  }[];
  gallery?: string[];
}

export const legendService = {
  /**
   * D1 실시간 성적표에서 1위 우승자 목록 자동 분류 조회
   */
  async getAllChampions(): Promise<ChampionWinner[]> {
    try {
      const data = await contestArchiveService.getAutoRoster();
      if (data.champions && data.champions.length > 0) {
        return data.champions;
      }
    } catch (err) {
      console.warn('[legendService] D1 실시간 우승자 로스터 조회 실패:', err);
    }
    return [];
  },

  /**
   * D1 실시간 성적표에서 오버롤 그랑프리 레전드 자동 분류 조회
   */
  async getGrandPrixLegends(): Promise<LegendItem[]> {
    try {
      const data = await contestArchiveService.getAutoRoster();
      if (data.legends && data.legends.length > 0) {
        return data.legends;
      }
    } catch (err) {
      console.warn('[legendService] D1 레전드 조회 실패:', err);
    }
    return [];
  },

  /**
   * ID 또는 이름으로 단일 선수 조회
   */
  async getChampionById(idOrName: string): Promise<any | null> {
    try {
      const data = await contestArchiveService.getAutoRoster();
      const all = [
        ...(data.legends || []), 
        ...(data.champions || []), 
        ...(data.youthMembers || [])
      ];

      const cleanInput = decodeURIComponent(idOrName).toLowerCase().trim();
      const pureName = cleanInput.replace(/^(champ-|legend-|youth-\d+-|youth-)/, '');

      const found = all.find(p => {
        if (!p) return false;
        const pId = decodeURIComponent(p.id || '').toLowerCase();
        const pName = (p.name || '').toLowerCase().trim();
        const pNameEn = (p.nameEn || '').toLowerCase().trim();

        const cleanNoHyphen = cleanInput.replace(/[\s-_]/g, '');
        const pNameEnNoHyphen = pNameEn.replace(/[\s-_]/g, '');
        const pIdNoHyphen = pId.replace(/[\s-_]/g, '');

        return (
          pId === cleanInput ||
          pName === cleanInput ||
          pName === pureName ||
          pId.includes(cleanInput) ||
          pId.includes(pureName) ||
          (pNameEn && (pNameEn === pureName || pNameEn === cleanInput)) ||
          (pNameEnNoHyphen && pNameEnNoHyphen === cleanNoHyphen) ||
          (pIdNoHyphen && pIdNoHyphen === cleanNoHyphen)
        );
      });

      if (found) return found;
    } catch (err) {
      console.warn('[legendService] 단일 선수 조회 실패:', err);
    }
    return null;
  }
};
