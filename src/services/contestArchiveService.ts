const API_BASE_URL = 'https://ybbf-api-worker.jbkim.workers.dev';
const CONTEST_ID = 'vEsEClzzEHCnZ1d8azo1';

export interface AutoRosterResponse {
  success: boolean;
  contestId: string;
  edition: {
    number: number;
    title: string;
    year: number;
    youthGeneration: string;
  };
  counts: {
    legends: number;
    champions: number;
    youthMembers: number;
    categories: number;
  };
  legends: any[];
  champions: any[];
  youthMembers: any[];
}

export const contestArchiveService = {
  /**
   * D1 실시간 대회 성적을 바탕으로 자동 분류된 로스터 반환
   * (Legends, Champions, Youth Club 기수 자동 배정)
   */
  async getAutoRoster(contestId: string = CONTEST_ID): Promise<AutoRosterResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/contests/${contestId}/auto-roster`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) return data;
      throw new Error(data.error || 'Failed to get auto-roster');
    } catch (err) {
      console.warn('[contestArchiveService] Live auto-roster fetch failed:', err);
      throw err;
    }
  }
};
