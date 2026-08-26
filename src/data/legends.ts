export interface Title {
  year: number;
  competition: string;
  result: string;
  class: string;
}

export interface Legend {
  id: string;
  name: string;
  nameEn: string;
  nickname?: string;
  profileImage: string;
  class: string;
  height: number;
  weight: number;
  club?: string;
  bio?: string;
  quote?: string;
  titles: Title[];
  gallery: string[];
  mediaIds?: string[];
}

export const legendsData: Legend[] = [
  {
    id: "kim-minsu",
    name: "김민수",
    nameEn: "KIM MINSU",
    nickname: "THE KOREAN THANOS",
    profileImage: "/cutout1.png", // public folder image fallback to picsum if needed later
    class: "클래식 피지크 +180cm",
    height: 188,
    weight: 115,
    club: "팀 타노스",
    bio: "한계를 부수고\n[무대] 위에서\n증명하는 자.\n그것이 [챔피언]이다.",
    quote: "It doesn't matter where you start, it's how you progress from there.",
    titles: [
      { year: 2023, competition: "용인시장배 보디빌딩 대회", result: "1위 / Overall", class: "클래식 피지크 +180cm" },
      { year: 2022, competition: "미스터 경기", result: "1위", class: "클래식 피지크 +180cm" },
    ],
    gallery: [
      "https://picsum.photos/800/1000?random=1",
      "https://picsum.photos/1000/800?random=2",
      "https://picsum.photos/800/800?random=3",
      "https://picsum.photos/1200/800?random=4",
    ]
  },
  {
    id: "lee-sangho",
    name: "이상호",
    nameEn: "LEE SANGHO",
    profileImage: "/cutout2.png", 
    class: "보디빌딩 -85kg",
    height: 175,
    weight: 85,
    club: "용인 피트니스",
    bio: "타고난 재능은\n[노력]을 이길 수 없다.\n매 순간이\n[성장]의 연속이다.",
    quote: "Focus on the process, not just the result.",
    titles: [
      { year: 2024, competition: "용인시장배 보디빌딩 대회", result: "1위", class: "보디빌딩 -85kg" },
      { year: 2021, competition: "YMCA 전국보디빌딩대회", result: "2위", class: "보디빌딩 -85kg" },
    ],
    gallery: [
      "https://picsum.photos/800/1000?random=5",
      "https://picsum.photos/1000/800?random=6",
    ]
  },
  {
    id: "park-junho",
    name: "박준호",
    nameEn: "PARK JUNHO",
    nickname: "THE SCULPTOR",
    profileImage: "https://picsum.photos/800/1200?random=7", // fallback transparent image if possible
    class: "스포츠 모델",
    height: 182,
    weight: 78,
    club: "에이펙스 짐",
    bio: "아름다운 육체는\n[조각]처럼 깎고\n[다듬는] 과정의 결실이다.",
    quote: "Dedication and discipline carve the ultimate masterpiece.",
    titles: [
      { year: 2025, competition: "용인시장배 보디빌딩 대회", result: "1위 / Overall", class: "스포츠 모델 오픈" },
    ],
    gallery: [
      "https://picsum.photos/800/1000?random=8",
      "https://picsum.photos/800/800?random=9",
    ]
  }
];
