// workers 루트 폴더 하위의 통합 가상 데이터베이스 (Mock DB)

export type UserRole = 'user' | 'athlete' | 'judge' | 'sponsor' | 'admin';

export interface UserProfile {
  name: string; // AES-256-GCM 암호화된 문자열
  birth: string;
  tel: string;  // AES-256-GCM 암호화된 문자열
  telLast4: string; // 검색용 평문 전화번호 끝 4자리
  gym: string;
  gender: string;
}

export interface User {
  uid: string;
  email: string;
  passwordHash?: string; // 단방향 PBKDF2 해싱된 문자열
  salt?: string;        // 유저 고유 16바이트 솔트
  provider: string;
  profileComplete: boolean;
  profile?: UserProfile | null;
  roles: UserRole[];    // 다중 역할군 배열
}

// 싱글톤으로 유지되는 인메모리 회원 데이터베이스
export const mockUsers: User[] = [];
