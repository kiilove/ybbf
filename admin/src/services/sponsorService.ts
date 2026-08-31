import { db } from './firebase';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';

export interface SponsorSocialLinks {
  homepage?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  x?: string;
  facebook?: string;
  blog?: string;
}

export interface SponsorItem {
  id: string;
  name: string;
  tag: 'DIAMOND' | 'PLATINUM' | 'GOLD' | 'OFFICIAL' | 'PARTNER' | string;
  slogan?: string;
  desc?: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO';
  status?: 'active' | 'expired' | 'inactive'; // 기본 active
  startDate?: string;
  endDate?: string;
  weight?: number;
  durationSeconds?: number | string;
  targetScenes?: string[];

  // 상세 담당자 및 사업장 정보
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  businessNumber?: string;

  // 다채널 SNS & 미디어 링크 풀
  socials?: SponsorSocialLinks;
}

export interface ContestSponsorDoc {
  docId: string;
  contestId: string;
  sponsors: SponsorItem[];
}

export const sponsorAdminService = {
  /**
   * contest_sponsor_list의 모든 문서 목록 조회
   */
  async getAllSponsorDocs(): Promise<ContestSponsorDoc[]> {
    try {
      const snap = await getDocs(collection(db, 'contest_sponsor_list'));
      const list: ContestSponsorDoc[] = [];
      snap.forEach(d => {
        const data = d.data();
        const rawSponsors = (data.sponsors || []) as SponsorItem[];
        const sponsors = rawSponsors.map((s, idx) => ({
          ...s,
          id: s.id || `sp_${Date.now()}_${idx}`,
          status: s.status || 'active',
          tag: s.tag || 'OFFICIAL',
          socials: s.socials || (s.linkUrl ? { homepage: s.linkUrl } : {})
        }));
        list.push({
          docId: d.id,
          contestId: data.contestId || d.id,
          sponsors
        });
      });
      return list;
    } catch (err) {
      console.error('스폰서 전체 문서 로드 에러:', err);
      throw err;
    }
  },

  /**
   * 특정 문서의 스폰서 목록 조회
   */
  async getSponsorDoc(docId: string): Promise<ContestSponsorDoc> {
    try {
      const docRef = doc(db, 'contest_sponsor_list', docId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return { docId, contestId: '', sponsors: [] };
      }
      const data = snap.data();
      const rawSponsors = (data.sponsors || []) as SponsorItem[];
      const sponsors = rawSponsors.map((s, idx) => ({
        ...s,
        id: s.id || `sp_${Date.now()}_${idx}`,
        status: s.status || 'active',
        tag: s.tag || 'OFFICIAL',
        socials: s.socials || (s.linkUrl ? { homepage: s.linkUrl } : {})
      }));
      return {
        docId: snap.id,
        contestId: data.contestId || snap.id,
        sponsors
      };
    } catch (err) {
      console.error('스폰서 문서 로드 에러:', err);
      throw err;
    }
  },

  /**
   * 스폰서 목록 전체 저장
   */
  async saveSponsors(docId: string, sponsors: SponsorItem[]): Promise<void> {
    try {
      const docRef = doc(db, 'contest_sponsor_list', docId);
      await updateDoc(docRef, {
        sponsors,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('스폰서 목록 저장 에러:', err);
      throw err;
    }
  },

  /**
   * 단일 스폰서 추가
   */
  async addSponsor(docId: string, sponsor: Omit<SponsorItem, 'id'>): Promise<SponsorItem> {
    const current = await this.getSponsorDoc(docId);
    const newSponsor: SponsorItem = {
      ...sponsor,
      id: `sp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      status: sponsor.status || 'active',
      socials: sponsor.socials || {}
    };

    const updated = [newSponsor, ...current.sponsors];
    await this.saveSponsors(docId, updated);
    return newSponsor;
  },

  /**
   * 단일 스폰서 수정
   */
  async updateSponsor(docId: string, sponsorId: string, updates: Partial<SponsorItem>): Promise<void> {
    const current = await this.getSponsorDoc(docId);
    const updated = current.sponsors.map(s => (s.id === sponsorId ? { ...s, ...updates } : s));
    await this.saveSponsors(docId, updated);
  },

  /**
   * 스폰서 상태 토글 (active <-> expired / inactive)
   */
  async toggleSponsorStatus(docId: string, sponsorId: string, newStatus: 'active' | 'expired' | 'inactive'): Promise<void> {
    await this.updateSponsor(docId, sponsorId, { status: newStatus });
  },

  /**
   * 스폰서 삭제
   */
  async deleteSponsor(docId: string, sponsorId: string): Promise<void> {
    const current = await this.getSponsorDoc(docId);
    const updated = current.sponsors.filter(s => s.id !== sponsorId);
    await this.saveSponsors(docId, updated);
  }
};
