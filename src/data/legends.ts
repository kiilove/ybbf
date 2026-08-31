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
  stagePhoto1?: string;
  stagePhoto2?: string;
  class: string;
  height?: number | null;
  weight?: number | null;
  club?: string;
  bio?: string;
  quote?: string;
  isGrandPrix?: boolean;
  titles: Title[];
  gallery: string[];
  mediaIds?: string[];
}

export const legendsData: Legend[] = [
  {
    id: "kang-seung-min",
    name: "강승민",
    nameEn: "KANG SEUNG-MIN",
    nickname: "THE TITAN OF YBBF",
    profileImage: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973711190_Athlete_striking_side_chest_pose_202608291221.jpeg",
    stagePhoto1: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973711190_Athlete_striking_side_chest_pose_202608291221.jpeg",
    stagePhoto2: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973719285_Athlete_striking_bicep_pose_202608291221.jpeg",
    class: "일반부 보디빌딩 (오버롤 그랑프리)",
    height: 174,
    weight: 87.56,
    club: "무소속",
    isGrandPrix: true,
    bio: "무대 위에서 뿜어져 나오는 압도적인 매스와 데피니션.\n수년간 다져온 극한의 인내가\n2026년 마침내 최고봉의 영예로 결실을 맺다.",
    quote: "한계라는 벽은 부수기 위해 존재한다. 진짜 승부는 무대 위에서 시작된다.",
    titles: [
      { year: 2026, competition: "제9회 용인특례시 보디빌딩대회", result: "👑 일반부 보디빌딩 오버롤 그랑프리", class: "남자 일반부 보디빌딩" },
      { year: 2026, competition: "제9회 용인특례시 보디빌딩대회", result: "🥇 +85kg 체급 1위", class: "남자 일반부 보디빌딩" },
    ],
    gallery: [
      "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973711190_Athlete_striking_side_chest_pose_202608291221.jpeg",
      "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973719285_Athlete_striking_bicep_pose_202608291221.jpeg",
    ]
  },
  {
    id: "kim-min-kyeong",
    name: "김민경",
    nameEn: "KIM MIN-KYEONG",
    nickname: "QUEEN OF BIKINI & MODEL",
    profileImage: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_0eee94b4-a403-4376-bf39-1d192c790e1a/1787805097349_Female_athlete_posing_with_skate…_202608271331.jpeg",
    stagePhoto1: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_0eee94b4-a403-4376-bf39-1d192c790e1a/1787805097349_Female_athlete_posing_with_skate…_202608271331.jpeg",
    stagePhoto2: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_0eee94b4-a403-4376-bf39-1d192c790e1a/1787805673713_Athlete_holding_skateboard_2K_202608271340.jpeg",
    class: "비키니 & 여자 모델 (2관왕 그랑프리)",
    height: null,
    weight: null,
    club: "단단짐",
    isGrandPrix: true,
    bio: "완벽한 비율과 독보적인 무대 연출력.\n비키니와 스포츠모델 부문을 모두 석권하며\n용인 무대의 새로운 여왕으로 등극하다.",
    quote: "아름다움은 끊임없는 자기 절제와 열정에서 피어납니다.",
    titles: [
      { year: 2026, competition: "제9회 용인특례시 보디빌딩대회", result: "👑 비키니 피트니스 오버롤 그랑프리", class: "비키니 피트니스" },
      { year: 2026, competition: "제9회 용인특례시 보디빌딩대회", result: "👑 여자 스포츠 모델 오버롤 그랑프리", class: "여자 스포츠 모델" },
      { year: 2026, competition: "제9회 용인특례시 보디빌딩대회", result: "🥇 비키니 -163cm 1위", class: "비키니 피트니스" },
    ],
    gallery: [
      "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_0eee94b4-a403-4376-bf39-1d192c790e1a/1787805097349_Female_athlete_posing_with_skate…_202608271331.jpeg",
      "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_0eee94b4-a403-4376-bf39-1d192c790e1a/1787805673713_Athlete_holding_skateboard_2K_202608271340.jpeg",
    ]
  },
  {
    id: "yoo-yong-soo",
    name: "유용수",
    nameEn: "YOO YONG-SOO",
    nickname: "CLASSIC SCULPTOR",
    profileImage: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_a8fc9bfd-da91-4491-973c-e8373f727dea/1787973297495_Athlete_striking_side_chest_pose_202608291214.jpeg",
    stagePhoto1: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_a8fc9bfd-da91-4491-973c-e8373f727dea/1787973297495_Athlete_striking_side_chest_pose_202608291214.jpeg",
    stagePhoto2: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_a8fc9bfd-da91-4491-973c-e8373f727dea/1787973305284_Athlete_striking_bicep_pose_202608291214.jpeg",
    class: "클래식 보디빌딩 (오버롤 그랑프리)",
    height: 170,
    weight: 69.9,
    club: "피트니스 유 짐",
    isGrandPrix: true,
    bio: "고전 조각상을 연상케 하는 완벽한 대칭과 조화.\n클래식 보디빌딩의 정수를 온몸으로 표현하며\n심사위원 만장일치 그랑프리를 거머쥐다.",
    quote: "클래식의 가치는 시간이 흘러도 변하지 않는 균형에 있습니다.",
    titles: [
      { year: 2026, competition: "제9회 용인특례시 보디빌딩대회", result: "👑 클래식 보디빌딩 오버롤 그랑프리", class: "남자 클래식 보디빌딩" },
      { year: 2026, competition: "제9회 용인특례시 보디빌딩대회", result: "🥇 클래식 보디빌딩 -168cm 1위", class: "남자 클래식 보디빌딩" },
    ],
    gallery: [
      "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_a8fc9bfd-da91-4491-973c-e8373f727dea/1787973297495_Athlete_striking_side_chest_pose_202608291214.jpeg",
      "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_a8fc9bfd-da91-4491-973c-e8373f727dea/1787973305284_Athlete_striking_bicep_pose_202608291214.jpeg",
    ]
  },
  {
    id: "kim-gwang-hyun",
    name: "김광현",
    nameEn: "KIM GWANG-HYUN",
    nickname: "AGELESS WARRIOR",
    profileImage: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_e610d371-0e7f-4eac-8bc1-cc0a092e892c/1787799278717_Muscular_man_performing_bicep_pose_202608271143.jpeg",
    stagePhoto1: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_e610d371-0e7f-4eac-8bc1-cc0a092e892c/1787799278717_Muscular_man_performing_bicep_pose_202608271143.jpeg",
    stagePhoto2: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_e610d371-0e7f-4eac-8bc1-cc0a092e892c/1787799286857_Muscular_man_flexing_abs_2K_202608271143.jpeg",
    class: "마스터즈 보디빌딩 (오버롤 그랑프리)",
    height: null,
    weight: null,
    club: "그린헬스",
    isGrandPrix: true,
    bio: "나이는 숫자에 불과하다는 것을 증명한 불굴의 베테랑.\n세월을 거스른 완벽한 근질과 밀도로\n마스터즈 부문 정상에 우뚝 서다.",
    quote: "열정에는 나이가 없습니다. 오늘의 땀방울이 내일의 역사가 됩니다.",
    titles: [
      { year: 2026, competition: "제9회 용인특례시 보디빌딩대회", result: "👑 마스터즈 보디빌딩 오버롤 그랑프리", class: "남자 마스터즈 보디빌딩" },
      { year: 2026, competition: "제9회 용인특례시 보디빌딩대회", result: "🥇 마스터즈 50~59세 체급 1위", class: "남자 마스터즈 보디빌딩" },
    ],
    gallery: [
      "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_e610d371-0e7f-4eac-8bc1-cc0a092e892c/1787799278717_Muscular_man_performing_bicep_pose_202608271143.jpeg",
      "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_e610d371-0e7f-4eac-8bc1-cc0a092e892c/1787799286857_Muscular_man_flexing_abs_2K_202608271143.jpeg",
    ]
  },
  {
    id: "oh-geun-seok",
    name: "오근석",
    nameEn: "OH GEUN-SEOK",
    nickname: "PHYSICAL ARTIST",
    profileImage: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_8f3d6fe5-88bf-4054-94bb-96be27787dd2/1787805178652_Fit_man_with_skateboard_202608271332.jpeg",
    stagePhoto1: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_8f3d6fe5-88bf-4054-94bb-96be27787dd2/1787805178652_Fit_man_with_skateboard_202608271332.jpeg",
    stagePhoto2: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_8f3d6fe5-88bf-4054-94bb-96be27787dd2/1787805686036_Athletic_man_holding_skateboard_2K_202608271340.jpeg",
    class: "스포츠 모델 (오버롤 그랑프리)",
    height: 175,
    weight: null,
    club: "피트니스 유 짐",
    isGrandPrix: true,
    bio: "무대를 런웨이로 바꾸는 압도적인 카리스마와 유려한 피지컬 라인.\n완벽한 컨디셔닝과 무대 매너로\n스포츠 모델 부문 최고점을 기록하다.",
    quote: "자신감은 준비된 몸에서 나오고, 완성된 무대는 관객을 사로잡습니다.",
    titles: [
      { year: 2026, competition: "제9회 용인특례시 보디빌딩대회", result: "👑 남자 스포츠 모델 오버롤 그랑프리", class: "남자 스포츠 모델" },
      { year: 2026, competition: "제9회 용인특례시 보디빌딩대회", result: "🥇 스포츠 모델 -178cm 1위", class: "남자 스포츠 모델" },
    ],
    gallery: [
      "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_8f3d6fe5-88bf-4054-94bb-96be27787dd2/1787805178652_Fit_man_with_skateboard_202608271332.jpeg",
      "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_8f3d6fe5-88bf-4054-94bb-96be27787dd2/1787805686036_Athletic_man_holding_skateboard_2K_202608271340.jpeg",
    ]
  },
  {
    id: "han-soo-man",
    name: "한수만",
    nameEn: "HAN SOO-MAN",
    nickname: "THE YOUTH PHENOM",
    profileImage: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_378efcf0-6e46-4cb4-a15d-d9bca1b4a098/1787973809633_Athlete_striking_side_chest_pose_202608291223.jpeg",
    stagePhoto1: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_378efcf0-6e46-4cb4-a15d-d9bca1b4a098/1787973809633_Athlete_striking_side_chest_pose_202608291223.jpeg",
    stagePhoto2: "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_378efcf0-6e46-4cb4-a15d-d9bca1b4a098/1787973816654_Athlete_striking_bicep_pose_202608291223.jpeg",
    class: "학생부 보디빌딩 (오버롤 그랑프리)",
    height: 173,
    weight: null,
    club: "마들짐",
    isGrandPrix: true,
    bio: "차세대 대한민국 보디빌딩을 이끌어갈 슈퍼 루키.\n학생부의 수준을 뛰어넘는 성숙한 근육 완성도로\n학생부 전체를 평정하고 오버롤 그랑프리에 등극하다.",
    quote: "오늘의 챔피언에 안주하지 않고, 내일의 세계 무대를 향해 나아갑니다.",
    titles: [
      { year: 2026, competition: "제9회 용인특례시 보디빌딩대회", result: "👑 학생부 보디빌딩 오버롤 그랑프리", class: "남자 학생부 보디빌딩" },
      { year: 2026, competition: "제9회 용인특례시 보디빌딩대회", result: "🥇 학생부 보디빌딩 -65kg 1위", class: "남자 학생부 보디빌딩" },
    ],
    gallery: [
      "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_378efcf0-6e46-4cb4-a15d-d9bca1b4a098/1787973809633_Athlete_striking_side_chest_pose_202608291223.jpeg",
      "https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_378efcf0-6e46-4cb4-a15d-d9bca1b4a098/1787973816654_Athlete_striking_bicep_pose_202608291223.jpeg",
    ]
  }
];
