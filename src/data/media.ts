export interface MediaItem {
  id: string;
  title: string;
  category: 'highlight' | 'interview' | 'training' | 'notice';
  thumbnail: string;
  videoUrl?: string;
  youtubeUrl?: string;
  date: string;
  description: string;
  featured?: boolean;
  relatedLegendIds?: string[];
}

export const mediaData: MediaItem[] = [
  {
    id: "m-001",
    title: "2025 용인시장배 보디빌딩 대회 하이라이트",
    category: "highlight",
    thumbnail: "https://picsum.photos/1200/800?random=m1",
    date: "2025-10-15",
    description: "올해 가장 뜨거웠던 무대, 그 영광의 순간들을 다시 만나보세요.",
    featured: true
  },
  {
    id: "m-002",
    title: "김민수 챔피언 인터뷰: 타노스의 훈련법",
    category: "interview",
    thumbnail: "https://picsum.photos/800/800?random=m2",
    date: "2025-09-20",
    description: "클래식 피지크 챔피언 김민수 선수가 말하는 고강도 훈련의 비밀.",
    relatedLegendIds: ["kim-minsu"]
  },
  {
    id: "m-003",
    title: "백스테이지 비하인드: 무대 오르기 10분 전",
    category: "highlight",
    thumbnail: "https://picsum.photos/800/1000?random=m3",
    date: "2025-09-15",
    description: "무대 뒤 선수들의 긴장감 넘치는 펌핑 현장을 담았습니다."
  },
  {
    id: "m-004",
    title: "초보자를 위한 포징 세미나 요약",
    category: "training",
    thumbnail: "https://picsum.photos/800/800?random=m4",
    date: "2025-08-01",
    description: "무대에서 단점을 가리고 장점을 극대화하는 포징의 기초."
  },
  {
    id: "m-005",
    title: "2026 대회 일정 및 규정 변경 안내",
    category: "notice",
    thumbnail: "https://picsum.photos/800/1000?random=m5",
    date: "2026-01-10",
    description: "내년도 대회 변경 사항과 참가 자격에 대한 공식 브리핑."
  }
];
