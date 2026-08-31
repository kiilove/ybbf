import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

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
  status?: 'active' | 'expired' | 'inactive';
  startDate?: string;
  endDate?: string;
  weight?: number;
  durationSeconds?: number;
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

export const sponsorService = {
  /**
   * 메인 웹 노출용 활성 스폰서 목록 조회 (status === 'active')
   */
  async getActiveSponsors(): Promise<SponsorItem[]> {
    try {
      const snap = await getDocs(collection(db, 'contest_sponsor_list'));
      if (snap.empty) {
        return [];
      }

      let targetDoc = snap.docs.find(d => d.data().contestId === 'vEsEClzzEHCnZ1d8azo1') || snap.docs[0];
      const data = targetDoc.data();
      const rawSponsors = (data.sponsors || []) as SponsorItem[];

      // 활성 상태인 모든 스폰서 (이미지 및 동영상 광고주 포함)
      return rawSponsors.filter(s => {
        const isActive = !s.status || s.status === 'active';
        return isActive;
      }).map(s => ({
        ...s,
        socials: s.socials || (s.linkUrl ? { homepage: s.linkUrl } : {})
      }));
    } catch (err) {
      console.warn('스폰서 로드 에러:', err);
      return [];
    }
  }
};
