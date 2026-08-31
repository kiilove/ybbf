export interface ContestNotice {
  id: string;
  contestTitle: string;
  contestDate: string;
  contestLocation: string;
  contestPromoter: string;
  contestCollectionFileLink: string;
  contestPriceBasic: number;
  contestPriceExtra: number;
  contestPriceExtraType?: string;
  contestPriceType1?: number | string;
  contestPriceType2?: number | string;
  contestBankName: string;
  contestAccountNumber: string;
  contestAccountOwner: string;
  contestPoster?: string;
  contestPosterTheme?: string[];
  contestTitleShort?: string;
  contestAssociate?: string;
  contestStatus?: string;
  contestCollectionName?: string;
  refContestId?: string;
}

export interface Contest {
  id: string;
  contestCategorysListId: string;
  contestGradesListId: string;
}

export interface Category {
  contestCategoryId: string;
  contestCategoryTitle: string;
  contestCategoryGender: string;
  contestCategoryPriceType: string;
  contestCategoryType?: string;
  contestCategorySection?: string;
}

export interface Grade {
  contestGradeId: string;
  contestGradeTitle: string;
  refCategoryId: string;
}

export interface JoinItem {
  contestCategoryId: string;
  contestCategoryTitle: string;
  contestCategoryPriceType: string;
  contestGradeId: string;
  contestGradeTitle: string;
}

export interface RegistrationPayload {
  id: string;
  playerUid: string;
  playerName: string;
  playerNumber?: string | number;
  playerGender: 'm' | 'f';
  playerBirth: string;
  playerTel: string;
  playerEmail?: string;
  playerGym: string;
  playerText?: string;
  playerPhotoUrl?: string;
  playerPhotoUrls?: string[];
  stagePhoto1?: string;
  stagePhoto2?: string;
  selectedPhotoUrls?: string[];
  publicStagePhoto1?: string;
  publicStagePhoto2?: string;
  publicPhotoUrls?: string[];
  playerService: boolean;
  joins: JoinItem[];
  contestPriceSum: number;
  contestPriceTotal: number;
  playerAge?: number | null;
  isPriceCheck: boolean;
  isCanceled: boolean;
  invoiceEdited: boolean;
  createBy: string;
  invoiceCreateAt: string;
  submittedAt: string;
  invoiceEditAt?: string;

  // 💡 대회 및 공고 정보 필드 추가 (실제 DB 및 폼 적재 스키마 반영)
  contestId: string;
  contestTitle: string;
  contestDate: string;
  contestLocation: string;
  contestPromoter: string;
  conntestPromoter?: string; // 오타 대응 필드 포함
  contestCollectionFileLink: string;
  contestPriceBasic: number;
  contestPriceExtra: number;
  contestPriceExtraType?: string;
  contestPriceType1?: number | string;
  contestPriceType2?: number | string;
  contestBankName: string;
  contestAccountNumber: string;
  contestAccountOwner: string;
  contestPoster?: string;
  contestPosterTheme?: string[];
  contestTitleShort?: string;
  contestAssociate?: string;
  contestStatus?: string;
  contestCollectionName?: string;
}

export interface MandatoryNotice {
  id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  youtubeUrl?: string;
  audioUrl?: string;
  images?: string[];
  attachments?: { name: string; url: string }[];
  isMandatory?: number;
  views?: number;
  sortOrder?: number;
  createdAt?: string;
}

export interface RegistrationSuccessInfo extends RegistrationPayload {
  invoiceId: string;
  d1Saved: boolean;
  d1Error: string | null;
}
