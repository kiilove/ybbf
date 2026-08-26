export type UserRole = 'user' | 'athlete' | 'judge' | 'sponsor' | 'admin';

export interface UserProfile {
  name: string;
  nickname?: string; // 선수 닉네임
  birth: string; // YYYY-MM-DD
  tel: string; // 010-XXXX-XXXX
  gym: string; // 소속 체육관
  gender: 'm' | 'f' | ''; // 성별
  profilePhotoUrl?: string; // 프로필 사진 URL
}

export interface User {
  uid: string;
  email: string;
  provider: 'email' | 'kakao' | 'naver' | 'google';
  profileComplete: boolean;
  profile?: UserProfile;
  roles?: UserRole[];
}
