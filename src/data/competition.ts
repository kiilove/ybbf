export type PhaseStatus = 'UPCOMING' | 'REGISTRATION' | 'CLOSED' | 'LIVE' | 'RESULT';

export interface CompetitionState {
  status: PhaseStatus;
  title: string;
  date: string;
  venue: string;
  dDay: number;
}

export const initialCompetitionState: CompetitionState = {
  status: 'LIVE', // Default to LIVE for design viewing purposes initially
  title: '2026 YBBF CHAMPIONSHIP',
  date: '2026. 10. 15',
  venue: '용인시 실내체육관 특설무대',
  dDay: 0,
};

export const liveCategories = [
  { id: 'bb', name: '보디빌딩', class: '-85kg' },
  { id: 'cp', name: '클래식 피지크', class: '-180cm' },
  { id: 'sm', name: '스포츠 모델', class: 'Tall' },
];

export const liveAthletes = [
  { id: 'a-01', name: '김민수', number: 104, votes: 450, percentage: 42, image: 'https://picsum.photos/400/500?random=c1' },
  { id: 'a-02', name: '이도현', number: 105, votes: 320, percentage: 30, image: 'https://picsum.photos/400/500?random=c2' },
  { id: 'a-03', name: '박성민', number: 106, votes: 150, percentage: 14, image: 'https://picsum.photos/400/500?random=c3' },
  { id: 'a-04', name: '최태환', number: 107, votes: 150, percentage: 14, image: 'https://picsum.photos/400/500?random=c4' },
];

export const mockComments = [
  { id: 1, nickname: '머슬왕', text: '104번 데피니션 미쳤네요 ㄷㄷ', time: '14:20' },
  { id: 2, nickname: '쇠질매니아', text: '김민수 선수 화이팅!! 🔥🔥', time: '14:21' },
  { id: 3, nickname: '프로다이어터', text: '이번 체급 경쟁 엄청 치열하네', time: '14:22' },
  { id: 4, nickname: '용인주민', text: '직관 못가서 아쉽 ㅠㅠ', time: '14:22' },
  { id: 5, nickname: '헬창1번', text: '105번 하체 갈라지는거 보소 💪', time: '14:23' },
];
