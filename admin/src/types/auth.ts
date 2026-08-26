export type UserRole = 'user' | 'athlete' | 'judge' | 'sponsor' | 'admin';

export interface UserProfile {
  name: string;
  birth: string; // YYYY-MM-DD
  tel: string; // 010-XXXX-XXXX
  gym: string; // 소속 체육관
  gender: 'm' | 'f' | ''; // 성별
}

export interface User {
  uid: string;
  email: string;
  provider: 'email' | 'kakao' | 'naver' | 'google';
  profileComplete: boolean;
  profile?: UserProfile;
  roles?: UserRole[];
  createdAt?: string;
}

export interface HeroPlayer {
  id: string;
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
}

export interface MenuItem {
  name: string;
  path: string;
  image: string;
}

export interface SponsorItem {
  id: string;
  name: string;
  logoUrl: string;
  sortOrder: number;
}

export interface SocialItem {
  id: string;
  imageUrl: string;
  type: string;
  aspect: string;
  linkUrl: string;
  sortOrder: number;
}

export interface AffiliationItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  sortOrder: number;
}

export interface SectionItem {
  sectionId: string;
  page: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  extraData?: Record<string, any> | null;
  updatedAt?: string;
}

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
  heroPlayers?: HeroPlayer[]; // 다중 선수 지원
  competitionPhase: string;
  competitionTitle: string;
  competitionDate: string;
  competitionVenue: string;
  competitionBankName: string;
  competitionAccountNumber: string;
  competitionAccountOwner: string;
  competitionPriceBasic: number;
  competitionPriceExtra: number;
  competitionMode?: 'manual' | 'firestore';
  activeNoticeId?: string;
  activeContestId?: string;
  competitionPosterUrl?: string;
  menuItems?: MenuItem[]; // 메뉴 관리 지원
  sponsors?: SponsorItem[]; // 스폰서 관리 지원
  socials?: SocialItem[]; // 소셜 배너 피드 지원
  sections?: SectionItem[]; // 랜딩/소개글 섹션 지원
  affiliations?: AffiliationItem[]; // 지부 연맹 지원
}

export interface MediaItem {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  videoUrl?: string;
  youtubeUrl?: string;
  date: string;
  description: string;
  featured?: boolean;
  relatedLegendIds?: string[];
  sortOrder?: number;
}

export interface ContestNoticeItem {
  id: string;
  contestTitle: string;
  contestTitleShort?: string;
  contestDate: string;
  contestLocation: string;
  refContestId: string;
  contestPriceBasic?: number;
  contestPriceExtra?: number;
  contestBankName?: string;
  contestAccountNumber?: string;
  contestAccountOwner?: string;
  contestStatus?: string;
  contestPoster?: string;
  contestCollectionFileLink?: string;
  contestOrgLogo?: string;
  contestPosterTheme?: string[];
  contestAssociate?: string;
  contestPromoter?: string;
  contestCollectionName?: string;
}

// 스태프 상태 타입
export type StaffStatus = 'active' | 'inactive' | 'pending';

// 소셜 링크 데이터 타입
export interface SnsLinks {
  instagram?: string;
  youtube?: string;
  [key: string]: string | undefined;
}

// 스태프 상세 데이터 인터페이스
export interface ContestStaff {
  uid: string;
  username: string;
  name: string;
  phone: string;
  role: 'staff' | 'admin';
  status: StaffStatus;
  contestId: string | null;
  email: string | null;
  position: string | null;
  isReferee: boolean;
  refereeGrade: string | null;
  profilePhotoUrl: string | null;
  businessIntro: string | null;
  snsLinks: SnsLinks | null;
  createdAt: string;
}


