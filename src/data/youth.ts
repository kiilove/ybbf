export interface YouthAthlete {
  id: string;
  name: string;
  grade: string;
  school: string;
  clubId: string;
  class: string;
  badge: 'YBBF_YOUTH';
  achievements?: string[];
  image?: string;
  quote?: string;
  bio?: string;
}

export interface YouthClub {
  id: string;
  name: string;
  location: string;
  coach: string;
  athleteCount: number;
  region: '용인시';
}

export const youthClubsData: YouthClub[] = [
  { id: 'c-001', name: '팀 타노스 짐', location: '용인시 처인구 역북동', coach: '김민수', athleteCount: 5, region: '용인시' },
  { id: 'c-002', name: '아이언 피트니스', location: '용인시 수지구 풍덕천동', coach: '이철호', athleteCount: 3, region: '용인시' },
  { id: 'c-003', name: '올림피아 바벨', location: '용인시 기흥구 구갈동', coach: '박지훈', athleteCount: 8, region: '용인시' },
  { id: 'c-004', name: 'YBBF 공식 트레이닝 센터', location: '용인시 처인구 남동', coach: '최영재', athleteCount: 12, region: '용인시' }
];

export const youthAthletesData: YouthAthlete[] = [
  {
    id: 'y-001',
    name: '김준호',
    grade: '고3',
    school: '용인고등학교',
    clubId: 'c-004',
    class: '-70kg',
    badge: 'YBBF_YOUTH',
    achievements: ['2025 용인시장배 학생부 1위', '2024 경기도민체전 고등부 3위'],
    image: 'https://picsum.photos/800/1000?random=y1',
    quote: '레전드 선배들의 길을 그대로 따라가겠습니다.',
    bio: 'YBBF 유스 시스템이 낳은 최고의 유망주 중 한 명. 탄탄한 하체와 완벽한 밸런스로 고등부 무대를 평정하고 있으며, 내년 성인 무대 데뷔를 앞두고 있습니다.'
  },
  {
    id: 'y-002',
    name: '이도현',
    grade: '고2',
    school: '수지고등학교',
    clubId: 'c-002',
    class: '-65kg',
    badge: 'YBBF_YOUTH',
    achievements: ['2025 미스터 경기 학생부 2위'],
    image: 'https://picsum.photos/800/1000?random=y2',
    quote: '무대 위에서는 나이가 중요하지 않습니다.',
    bio: '특유의 빗살무늬 데피니션으로 무장한 이도현 선수는 고등학교 2학년임에도 불구하고 놀라운 다이어트 강도를 자랑합니다.'
  },
  {
    id: 'y-003',
    name: '박성민',
    grade: '고1',
    school: '신갈고등학교',
    clubId: 'c-003',
    class: '-75kg',
    badge: 'YBBF_YOUTH',
    image: 'https://picsum.photos/800/1000?random=y3',
    quote: '하루하루 쇠질에 거짓은 없습니다.',
    bio: '올해 갓 고등학교에 입학한 루키. 큰 골격과 넓은 프레임을 바탕으로 무한한 성장 가능성을 보여주고 있습니다.'
  },
  {
    id: 'y-004',
    name: '최태환',
    grade: '고3',
    school: '태성고등학교',
    clubId: 'c-001',
    class: '+80kg',
    badge: 'YBBF_YOUTH',
    achievements: ['2024 YMCA 학생부 헤비급 1위'],
    image: 'https://picsum.photos/800/1000?random=y4',
    quote: '가장 무겁게, 가장 완벽하게.',
    bio: '고등부에서는 보기 드문 엄청난 사이즈와 볼륨감을 자랑하는 헤비급 유망주입니다. 팀 타노스의 집중 관리를 받으며 성인 무대를 준비합니다.'
  },
  {
    id: 'y-005',
    name: '정지훈',
    grade: '고2',
    school: '보정고등학교',
    clubId: 'c-002',
    class: '-65kg',
    badge: 'YBBF_YOUTH',
    image: 'https://picsum.photos/800/1000?random=y5'
  },
  {
    id: 'y-006',
    name: '윤건우',
    grade: '고1',
    school: '포곡고등학교',
    clubId: 'c-004',
    class: '-60kg',
    badge: 'YBBF_YOUTH',
    image: 'https://picsum.photos/800/1000?random=y6'
  }
];
