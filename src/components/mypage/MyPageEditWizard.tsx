import React from 'react';
import { 
  User as UserIcon, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Sparkles, 
  X, 
  Check, 
  ArrowRight, 
  Dribbble, 
  ShieldCheck, 
  FileCheck, 
  Lock, 
  Loader2, 
  Copy, 
  Upload, 
  FileText, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { 
  RegistrationPayload, 
  JoinItem, 
  Category, 
  Grade, 
  MandatoryNotice 
} from '../../types/registration';
import { NoticeScrollReader, YouTubePlayer, ImageCarousel, PHOTO_SERVICE_PRICE } from './NoticeComponents';

interface MyPageEditWizardProps {
  editingInvoice: RegistrationPayload;
  setEditingInvoice: React.Dispatch<React.SetStateAction<RegistrationPayload | null>>;
  hasNotice: boolean;
  currentStepId: string;
  activeSteps: string[];
  stepperCols: any[];
  mandatoryNotices: MandatoryNotice[];
  currentNoticeIndex: number;
  setCurrentNoticeIndex: React.Dispatch<React.SetStateAction<number>>;
  agreedNoticeIds: string[];
  setAgreedNoticeIds: React.Dispatch<React.SetStateAction<string[]>>;
  scrollReadComplete: boolean;
  setScrollReadComplete: React.Dispatch<React.SetStateAction<boolean>>;
  videoWatchedComplete: boolean;
  setVideoWatchedComplete: React.Dispatch<React.SetStateAction<boolean>>;
  imagesViewedComplete: boolean;
  setImagesViewedComplete: React.Dispatch<React.SetStateAction<boolean>>;
  editingValidate: { playerName: boolean; playerBirth: boolean; playerTel: boolean; playerGym: boolean };
  handleEditBirthChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditTelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getPlayerAgeForEdit: () => number | null;
  setIsDemoOpen: (open: boolean) => void;
  handleEditDrag: (e: React.DragEvent) => void;
  handleEditDrop: (e: React.DragEvent) => void;
  isDragActive: boolean;
  handleEditFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  photosList: { id: string; file: File | null; url: string }[];
  handleRemovePhoto: (id: string) => void;
  handleSetRepresentative: (index: number) => void;
  setIsPhotoDetailOpen: (open: boolean) => void;
  goToPrevStep: () => void;
  goToNextStep: () => void;
  showAlert: (msg: string, title?: string) => void;
  chkAllItem: boolean;
  setChkAllItem: (chk: boolean) => void;
  handleResetEditSelections: () => void;
  filteredCategories: Category[];
  grades: Grade[];
  handleEditCategorySelect: (catId: string, catTitle: string, catPriceType: string, e: React.ChangeEvent<HTMLSelectElement>) => void;
  totalEditPrice: number;
  policyAccepted: boolean;
  setPolicyAccepted: (accepted: boolean) => void;
  handleFinalEditSubmit: () => Promise<void>;
  isSubmitting: boolean;
  isPhotoUploading: boolean;
  handleCopyAccount: () => void;
  copySuccess: boolean;
  handleCancelEdit: () => void;
  error: string | null;
}

export function MyPageEditWizard({
  editingInvoice,
  setEditingInvoice,
  hasNotice,
  currentStepId,
  stepperCols,
  mandatoryNotices,
  currentNoticeIndex,
  setCurrentNoticeIndex,
  agreedNoticeIds,
  setAgreedNoticeIds,
  scrollReadComplete,
  setScrollReadComplete,
  videoWatchedComplete,
  setVideoWatchedComplete,
  imagesViewedComplete,
  setImagesViewedComplete,
  editingValidate,
  handleEditBirthChange,
  handleEditTelChange,
  getPlayerAgeForEdit,
  setIsDemoOpen,
  handleEditDrag,
  handleEditDrop,
  isDragActive,
  handleEditFileChange,
  photosList,
  handleRemovePhoto,
  handleSetRepresentative,
  goToPrevStep,
  goToNextStep,
  showAlert,
  chkAllItem,
  setChkAllItem,
  handleResetEditSelections,
  filteredCategories,
  grades,
  handleEditCategorySelect,
  totalEditPrice,
  policyAccepted,
  setPolicyAccepted,
  handleFinalEditSubmit,
  isSubmitting,
  isPhotoUploading,
  handleCopyAccount,
  copySuccess,
  handleCancelEdit,
  error,
}: MyPageEditWizardProps) {
  const isEditingValidate = !editingValidate.playerName && !editingValidate.playerBirth && !editingValidate.playerTel && !editingValidate.playerGym;

  return (
    <div className="pt-28 pb-24 px-4 md:px-12 max-w-[900px] mx-auto min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden font-sans">
      {/* Background neon glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* HEADER SECTION */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#2d4a1f]/35 border border-accent/20 mb-4">
          <span className="text-[9px] md:text-[10px] text-accent font-bold tracking-wider font-sans">참가 신청 정보 수정</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-black mb-3 tracking-tight text-white uppercase">
          대회 참가 <span className="text-accent">신청서 수정</span>
        </h1>
        <p className="text-white/60 text-xs md:text-sm font-sans">
          등록된 참가 신청 정보를 수정합니다. 수정 후 확인이 지연될 수 있습니다.
        </p>
      </div>

      {/* PREMIUM STEPPER BAR */}
      <div className={`grid ${hasNotice ? 'grid-cols-4' : 'grid-cols-3'} mb-12 w-full bg-[#161a16] border border-white/10 rounded-xl overflow-hidden shadow-lg divide-x divide-white/10`}>
        {stepperCols.map((col, index) => (
          <div 
            key={col.id}
            onClick={() => col.canClick && col.onClick()}
            className={`flex flex-col sm:flex-row items-center justify-center gap-2.5 py-4 sm:py-5 px-3 transition-all ${
              col.isActive ? 'bg-accent/[0.03]' : 'hover:bg-white/[0.01]'
            } ${col.canClick ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}
          >
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all shrink-0 ${
              col.isActive 
                ? 'bg-accent text-black font-black shadow-[0_0_12px_rgba(210,255,0,0.15)]' 
                : col.isCompleted 
                  ? 'bg-accent/20 text-accent border border-accent/40' 
                  : 'bg-[#1d1f1d] text-white/40 border border-white/5'
            }`}>
              {col.isCompleted ? <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : (index + 1)}
            </div>
            <div className="text-center sm:text-left shrink-0">
              <span className="block text-[8px] sm:text-[9px] uppercase font-mono text-white/30 tracking-wider">{col.stepNumStr}</span>
              <span className={`text-[10px] sm:text-xs md:text-sm font-bold transition-colors block ${col.isActive ? 'text-white font-black' : 'text-white/40'}`}>{col.title}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CONTEST SPEC CARD */}
      <div className="bg-[#161a16] border border-white/10 rounded-xl p-5 sm:p-6 md:p-8 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
          <div className="flex-1">
            <span className="text-[10px] md:text-xs text-accent font-bold block mb-1">
              {editingInvoice.contestPromoter} • 공식 대회 안내
            </span>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-sans tracking-tight text-white leading-tight">
              {editingInvoice.contestTitle}
            </h2>
          </div>
          <button
            onClick={() => handleCancelEdit()}
            className="flex items-center justify-center gap-2 bg-red-950/20 hover:bg-red-950/40 text-red-200 w-full md:w-auto px-5 py-3 md:py-2.5 rounded border border-red-500/20 text-xs md:text-sm font-bold transition-all shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" /> 수정 취소 (돌아가기)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-accent shrink-0" />
            <div>
              <span className="text-[10px] md:text-xs text-white/40 uppercase font-mono block">대회 개최 일시</span>
              <span className="text-xs sm:text-sm font-bold text-white">{editingInvoice.contestDate}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-accent shrink-0" />
            <div>
              <span className="text-[10px] md:text-xs text-white/40 uppercase font-mono block">대회 개최 장소</span>
              <span className="text-xs sm:text-sm font-bold text-white">{editingInvoice.contestLocation}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-accent shrink-0" />
            <div>
              <span className="text-[10px] md:text-xs text-white/40 uppercase font-mono block">접수 참가비</span>
              <span className="text-xs sm:text-sm font-bold text-white">
                기본 {editingInvoice.contestPriceBasic?.toLocaleString()}원 
                <span className="text-accent/80 font-normal text-[10px] md:text-xs block mt-0.5">
                  중복출전 +{editingInvoice.contestPriceExtra?.toLocaleString()}원
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-6 py-4 rounded-xl mb-6 text-xs">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-[#161a16] border border-white/10 rounded-xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
          
          {/* DYNAMIC STEP: MANDATORY NOTICE */}
          {currentStepId === 'notice' && mandatoryNotices.length > 0 && (
            <div className="space-y-8 transition-all duration-300">
              <div className="border-b border-white/10 pb-4 mb-6 flex justify-between items-center">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-accent tracking-tight flex items-start gap-2.5 break-keep">
                    <Sparkles className="w-5.5 h-5.5 text-accent shrink-0 mt-0.5 animate-pulse" />
                    <span>대회 참가 접수 필수 공지사항 동의</span>
                  </h3>
                  <p className="text-xs md:text-sm text-white/60 mt-1.5 break-keep leading-relaxed font-sans">
                    대회 출전을 위해 아래 공지사항을 반드시 확인하시고 동의해 주시기 바랍니다.
                  </p>
                </div>
                <div className="text-[10px] font-mono bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded font-bold shrink-0">
                  {currentNoticeIndex + 1} / {mandatoryNotices.length}
                </div>
              </div>

              {/* 공지 내용 영역 */}
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] text-accent/80 font-bold uppercase tracking-widest font-mono block mb-1">
                    MANDATORY NOTICE
                  </span>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-white leading-snug">
                    {mandatoryNotices[currentNoticeIndex].title}
                  </h2>
                </div>

                {/* 다중 사진 캐러셀 */}
                {mandatoryNotices[currentNoticeIndex].images && mandatoryNotices[currentNoticeIndex].images.length > 0 && (
                  <ImageCarousel 
                    images={mandatoryNotices[currentNoticeIndex].images} 
                    onAllViewed={() => setImagesViewedComplete(true)}
                  />
                )}

                {/* 본영상/유튜브 영상 시청 영역 */}
                {mandatoryNotices[currentNoticeIndex].videoUrl && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/50 font-bold uppercase tracking-wider font-mono">필수 시청 동영상 (직접 업로드)</p>
                    <video
                      src={mandatoryNotices[currentNoticeIndex].videoUrl.split('#')[0]}
                      controls
                      onEnded={() => setVideoWatchedComplete(true)}
                      className={`rounded-lg shadow-sm border border-white/10 ${
                        mandatoryNotices[currentNoticeIndex].videoUrl.includes('#vertical')
                          ? 'aspect-[9/16] max-w-[320px] mx-auto'
                          : 'aspect-[16/9] w-full'
                      }`}
                    />
                  </div>
                )}

                {mandatoryNotices[currentNoticeIndex].youtubeUrl && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/50 font-bold uppercase tracking-wider font-mono">필수 시청 동영상 (YouTube)</p>
                    <YouTubePlayer
                      url={mandatoryNotices[currentNoticeIndex].youtubeUrl}
                      onEnded={() => setVideoWatchedComplete(true)}
                    />
                  </div>
                )}

                {mandatoryNotices[currentNoticeIndex].content && (
                  <div className="space-y-2">
                    <p className="text-xs text-white/50 font-bold uppercase tracking-wider font-mono">공지사항 본문 정독 (스크롤을 끝까지 내려주세요)</p>
                    <NoticeScrollReader
                      content={mandatoryNotices[currentNoticeIndex].content}
                      onReadComplete={() => setScrollReadComplete(true)}
                    />
                  </div>
                )}

                {/* 첨부파일 영역 */}
                {mandatoryNotices[currentNoticeIndex].attachments && mandatoryNotices[currentNoticeIndex].attachments.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-xs text-white/50 font-bold uppercase tracking-wider font-mono">첨부 문서 다운로드</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mandatoryNotices[currentNoticeIndex].attachments.map((file: { name: string; url: string }, idx: number) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-[#1d1f1d] hover:bg-white/5 border border-white/10 rounded-lg text-white text-xs font-bold transition-all"
                        >
                          <span className="truncate pr-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-accent shrink-0" />
                            {file.name}
                          </span>
                          <span className="text-accent hover:underline shrink-0 text-[10px] sm:text-xs flex items-center gap-1 font-sans">
                            다운로드
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 하단 제어 영역 */}
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-white/50 text-center sm:text-left space-y-1">
                  {!scrollReadComplete && (
                    <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <AlertCircle className="w-3.5 h-3.5 text-white/50 shrink-0" />
                      공지사항 본문을 읽어주십시오.
                    </p>
                  )}
                  {!videoWatchedComplete && (
                    <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <AlertCircle className="w-3.5 h-3.5 text-white/50 shrink-0" />
                      필수 시청 동영상을 끝까지 시청해주십시오.
                    </p>
                  )}
                  {!imagesViewedComplete && (
                    <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                      <AlertCircle className="w-3.5 h-3.5 text-white/50 shrink-0" />
                      모든 설명 이미지 카드를 끝까지 확인해주십시오.
                    </p>
                  )}
                  {scrollReadComplete && videoWatchedComplete && imagesViewedComplete && (
                    <p className="text-accent font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent animate-pulse shrink-0" />
                      모든 필수 조건 확인 검증을 완료했습니다.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!(scrollReadComplete && videoWatchedComplete && imagesViewedComplete)}
                  onClick={() => {
                    const noticeId = mandatoryNotices[currentNoticeIndex].id;
                    const newAgreed = [...agreedNoticeIds, noticeId];
                    setAgreedNoticeIds(newAgreed);

                    if (currentNoticeIndex < mandatoryNotices.length - 1) {
                      setCurrentNoticeIndex((prev) => prev + 1);
                    } else {
                      goToNextStep();
                    }
                  }}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    scrollReadComplete && videoWatchedComplete && imagesViewedComplete
                      ? 'bg-accent text-black hover:bg-white hover:scale-[1.03] active:scale-95 shadow-md shadow-accent/25'
                      : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {currentNoticeIndex < mandatoryNotices.length - 1 ? (
                    <>
                      동의 완료 및 다음 공지 <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  ) : (
                    <>
                      모든 필수 공지 확인 완료 <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: PERSONAL INFO & PHOTO UPLOAD */}
          {currentStepId === 'info' && (
            <div className="space-y-8 transition-all duration-300">
              <div className="border-b border-white/10 pb-4 mb-6">
                <h3 className="text-base md:text-lg font-bold text-accent tracking-tight flex items-start gap-2.5 break-keep">
                  <UserIcon className="w-5.5 h-5.5 text-accent shrink-0 mt-0.5" />
                  <span>1. 참가자 인적 정보 & 프로필 등록</span>
                </h3>
                <p className="text-xs md:text-sm text-white/60 mt-1.5 break-keep leading-relaxed">대회 참가를 위한 인적 인포메이션과 전광판 송출용 사진을 수집합니다.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 성명 */}
                <div>
                  <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                    선수 성명 <span className="text-accent">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={editingInvoice.playerName}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, playerName: e.target.value })}
                    placeholder="실명 입력"
                    className={`w-full bg-[#0a0a0a] border ${editingValidate.playerName ? 'border-red-500' : 'border-white/10 focus:border-accent'} rounded px-4 py-3 md:py-3.5 text-white focus:outline-none text-xs md:text-sm transition-all`} 
                  />
                  {editingValidate.playerName && <p className="text-red-400 text-[10px] md:text-xs mt-1">2자 이상의 성명을 입력해주세요.</p>}
                </div>

                {/* 성별 */}
                <div>
                  <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                    선수 성별 <span className="text-accent">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingInvoice({ ...editingInvoice, playerGender: 'm' })}
                      className={`py-3 md:py-3.5 rounded text-xs md:text-sm font-bold border transition-all ${
                        editingInvoice.playerGender === 'm'
                          ? 'bg-accent text-black border-accent font-black'
                          : 'bg-[#0a0a0a] text-white/60 border-white/10 hover:border-white/20'
                      }`}
                    >
                      남자 (Male)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingInvoice({ ...editingInvoice, playerGender: 'f' })}
                      className={`py-3 md:py-3.5 rounded text-xs md:text-sm font-bold border transition-all ${
                        editingInvoice.playerGender === 'f'
                          ? 'bg-accent text-black border-accent font-black'
                          : 'bg-[#0a0a0a] text-white/60 border-white/10 hover:border-white/20'
                      }`}
                    >
                      여자 (Female)
                    </button>
                  </div>
                </div>

                {/* 생년월일 */}
                <div>
                  <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                    생년월일 <span className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={editingInvoice.playerBirth}
                      onChange={handleEditBirthChange}
                      maxLength={10}
                      placeholder="YYYY-MM-DD"
                      className={`w-full bg-[#0a0a0a] border ${editingValidate.playerBirth ? 'border-red-500' : 'border-white/10 focus:border-accent'} rounded px-4 py-3 md:py-3.5 text-white focus:outline-none text-xs md:text-sm font-mono transition-all`} 
                    />
                    {getPlayerAgeForEdit() !== null && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] md:text-xs bg-accent/20 text-accent font-bold px-2 py-0.5 rounded">
                        만 {getPlayerAgeForEdit()}세
                      </span>
                    )}
                  </div>
                  {editingValidate.playerBirth && <p className="text-red-400 text-[10px] md:text-xs mt-1">생년월일 8자리를 입력해주세요. (예: 1999-12-31)</p>}
                </div>

                {/* 연락처 */}
                <div>
                  <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                    휴대전화 번호 <span className="text-accent">*</span>
                  </label>
                  <input 
                    type="tel" 
                    value={editingInvoice.playerTel}
                    onChange={handleEditTelChange}
                    maxLength={13}
                    placeholder="010-0000-0000"
                    className={`w-full bg-[#0a0a0a] border ${editingValidate.playerTel ? 'border-red-500' : 'border-white/10 focus:border-accent'} rounded px-4 py-3 md:py-3.5 text-white focus:outline-none text-xs md:text-sm font-mono transition-all`} 
                  />
                  {editingValidate.playerTel && <p className="text-red-400 text-[10px] md:text-xs mt-1">'010' 포함 올바른 연락처 번호를 입력해주세요.</p>}
                </div>

                {/* 이메일 */}
                <div>
                  <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                    이메일 주소
                  </label>
                  <input 
                    type="email" 
                    value={editingInvoice.playerEmail}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, playerEmail: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full bg-[#0a0a0a] border border-white/10 focus:border-accent rounded px-4 py-3 md:py-3.5 text-white focus:outline-none text-xs md:text-sm transition-all" 
                  />
                </div>

                {/* 소속 */}
                <div>
                  <label className="block text-[10px] md:text-xs text-white/50 mb-2 font-mono tracking-widest uppercase font-semibold">
                    소속 (클럽/체육관) <span className="text-accent">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={editingInvoice.playerGym}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, playerGym: e.target.value })}
                    placeholder="소속 단체명 (없을 시 '무소속' 기재)"
                    className={`w-full bg-[#0a0a0a] border ${editingValidate.playerGym ? 'border-red-500' : 'border-white/10 focus:border-accent'} rounded px-4 py-3 md:py-3.5 text-white focus:outline-none text-xs md:text-sm transition-all`} 
                  />
                  {editingValidate.playerGym && <p className="text-red-400 text-[10px] md:text-xs mt-1">소속이 없으시다면 '무소속'이라고 작성해주세요.</p>}
                </div>
              </div>

              {/* 선수 사진 R2 업로드 영역 */}
              <div className="space-y-4 pt-2">
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-white flex flex-wrap items-center gap-2 uppercase tracking-wider">
                    <span className="break-keep">무대 전광판(LED) 선수 프로필 사진 등록</span>
                    <span className="text-accent text-[9px] md:text-[10px] font-bold whitespace-nowrap bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">추천</span>
                  </h4>
                  <div className="text-xs md:text-[13px] text-white/60 mt-1.5 leading-relaxed font-sans break-keep flex flex-col md:flex-row md:items-center gap-3">
                    <span className="flex-1">
                      선수님이 무대에 입장할 때, 본부석 대형 전광판 스크린에 해당 프로필 사진이 이름/소속과 함께 실시간 송출되어 압도적인 오프닝을 연출합니다. 본인의 개성이 담긴 선명한 정면 상반신 사진 등록을 추천드립니다.
                    </span>
                    <button 
                      type="button"
                      onClick={() => setIsDemoOpen(true)}
                      className="text-accent hover:text-white font-bold text-xs flex items-center gap-1.5 shrink-0 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-lg hover:bg-accent hover:text-black transition-all cursor-pointer shadow-sm shadow-accent/5"
                    >
                      <Sparkles className="w-3.5 h-3.5 font-bold" />
                      접수 사진을 등록하는 이유 (전광판 연출 데모)
                    </button>
                  </div>
                </div>

                <div 
                  onDragEnter={handleEditDrag}
                  onDragLeave={handleEditDrag}
                  onDragOver={handleEditDrag}
                  onDrop={handleEditDrop}
                  className={`relative border-2 border-dashed rounded-xl p-6 md:p-8 transition-all flex flex-col items-center justify-center bg-[#161a16]/50 ${
                    isDragActive 
                      ? 'border-accent bg-accent/5' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <label className="cursor-pointer flex flex-col items-center text-center p-4 w-full">
                    <div className="w-12 h-12 bg-[#1d1f1d] border border-white/10 rounded-full flex items-center justify-center mb-3 text-white/45 hover:text-accent transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-white block mb-1 md:hidden">이곳을 터치하여 프로필 사진 등록 (여러 장 가능)</span>
                    <span className="text-xs font-bold text-white block mb-1 hidden md:block">드래그하여 사진들을 여기에 놓거나 클릭하세요 (여러 장 업로드 지원)</span>
                    <span className="text-xs text-white/60 block leading-relaxed mb-3">
                      상반신 정면이 선명한 JPG, PNG, HEIC 파일 (각 최대 30MB)
                    </span>
                    <span className="inline-block bg-[#1d1f1d] hover:bg-accent hover:text-black text-white border border-white/10 px-5 py-2.5 rounded text-[10px] md:text-xs font-bold transition-all text-center">
                      이미지 파일 선택
                    </span>
                    <input 
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleEditFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 다중 사진 썸네일 그리드 */}
                {photosList.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                    {photosList.map((photo, index) => (
                      <div 
                        key={photo.id} 
                        className="relative group border border-white/10 rounded-xl overflow-hidden bg-[#0a0a0a] p-2 flex flex-col items-center"
                      >
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-white/5 bg-[#161a16]">
                          <img src={photo.url} alt={`선수 사진 ${index + 1}`} className="w-full h-full object-cover" />
                          
                          {index === 0 && (
                            <span className="absolute top-1.5 left-1.5 bg-accent text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                              대표 사진
                            </span>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full border border-white/10 transition-colors cursor-pointer"
                            title="삭제"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div className="w-full mt-2 flex flex-col gap-1 text-center">
                          <p className="text-[10px] text-white/70 truncate w-full px-1" title={photo.file?.name || '기존 등록 사진'}>
                            {photo.file?.name || '등록된 프로필 사진'}
                          </p>
                          {photo.file && (
                            <p className="text-[9px] text-white/40 font-mono">
                              {(photo.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetRepresentative(index)}
                              className="mt-1 bg-white/5 hover:bg-accent hover:text-black text-white text-[9px] py-1 px-2 rounded font-bold transition-all border border-white/10 cursor-pointer"
                            >
                              대표로 설정
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 참여동기 */}
              <div>
                <label className="block text-[10px] text-white/50 mb-2 font-mono tracking-widest uppercase">
                  선수 소개 및 참여 동기 (장내 아나운서 낭독용)
                </label>
                <textarea 
                  value={editingInvoice.playerText}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, playerText: e.target.value })}
                  placeholder="무대 입장 시 장내 아나운서가 낭독하여 선수를 홍보할 수 있는 사회자 코멘트 프로필로 사용됩니다."
                  rows={3}
                  className="w-full bg-[#0a0a0a] border border-white/10 focus:border-accent rounded p-4 text-white focus:outline-none text-xs resize-none transition-all"
                />
              </div>

              {/* 스텝 이동 및 다음 단계 버튼 */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row justify-between gap-4">
                {hasNotice ? (
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="w-full sm:w-auto text-center bg-[#0a0a0a] hover:bg-[#1d1f1d] text-white border border-white/10 px-5 py-3.5 rounded text-xs font-bold transition-all text-center cursor-pointer"
                  >
                    이전 단계 (공지사항)
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isEditingValidate) {
                      goToNextStep();
                    } else {
                      showAlert('필수 인적 사항(* 표시)을 올바르게 채워주셔야 다음 단계로 진입하실 수 있습니다.', '필수 입력 누락');
                    }
                  }}
                  className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    isEditingValidate 
                      ? 'bg-accent text-black font-black hover:bg-white'
                      : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {hasNotice ? '3단계 종목 선택으로 이동' : '2단계 종목 선택으로 이동'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CATEGORY & GRADE SELECTION */}
          {currentStepId === 'joins' && (
            <div className="space-y-6 transition-all duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-accent tracking-tight flex items-start gap-2.5 break-keep">
                    <Dribbble className="w-5.5 h-5.5 text-accent shrink-0 mt-0.5" />
                    <span>2. 참가 종목 및 체급 선택</span>
                  </h3>
                  <p className="text-xs md:text-sm text-white/60 mt-1.5 break-keep leading-relaxed">출전하고자 하는 부문의 세부 체급을 선택하세요.</p>
                </div>
                
                <div className="flex flex-row sm:flex-row w-full sm:w-auto gap-2">
                  <button
                    type="button"
                    onClick={() => setChkAllItem(!chkAllItem)}
                    className="flex-1 sm:flex-none text-center bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white text-[10px] px-3.5 py-2.5 rounded font-bold transition-colors cursor-pointer"
                  >
                    {chkAllItem ? '성별 맞춤 종목만 보기' : '전체 종목 리스트 보기'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetEditSelections}
                    className="flex-1 sm:flex-none text-center bg-red-950/20 border border-red-900/30 text-red-200 text-[10px] px-3.5 py-2.5 rounded font-bold hover:bg-red-950/40 transition-colors cursor-pointer"
                  >
                    선택 초기화
                  </button>
                </div>
              </div>

              <p className="text-xs md:text-sm text-white/40 leading-relaxed font-sans">
                * 대회 규정에 의거하여 나이/성별에 따른 제한 조건을 확인해 주시기 바랍니다. (상향 지원은 가능하나 하향 지원 불가)<br />
                * 종목 카드 내부의 체급 선택 박스를 누르고 원하는 세부 체급을 지정하면 신청 목록에 추가됩니다.
              </p>

              <div className="divide-y divide-white/5 border-t border-b border-white/10 py-1">
                {filteredCategories.map((cat: Category) => {
                  const matchGrades = grades.filter((g: Grade) => g.refCategoryId === cat.contestCategoryId);
                  const selectedJoinObj = editingInvoice.joins.find((j: JoinItem) => j.contestCategoryId === cat.contestCategoryId);
                  const isSelected = !!selectedJoinObj;

                  return (
                    <div 
                      key={cat.contestCategoryId}
                      className={`flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4 transition-all duration-200 ${
                        isSelected 
                          ? 'bg-accent/[0.02] px-3 md:px-5 -mx-3 md:-mx-5 rounded-lg' 
                          : ''
                      }`}
                    >
                      <div className="mb-2 sm:mb-0">
                        <span className={`text-[9px] md:text-[10px] uppercase font-mono px-2 py-0.5 rounded mr-2.5 font-bold ${
                          cat.contestCategoryGender === '남' 
                            ? 'bg-blue-950/60 text-blue-300' 
                            : cat.contestCategoryGender === '여'
                              ? 'bg-pink-950/60 text-pink-300'
                              : 'bg-zinc-800/80 text-zinc-300'
                        }`}>
                          {cat.contestCategoryGender}성 부문
                        </span>
                        <span className="text-xs md:text-sm font-bold text-white tracking-tight">{cat.contestCategoryTitle}</span>
                        {isSelected && (
                          <span className="ml-2.5 text-xs md:text-sm text-accent font-bold font-mono">
                            ✓ {selectedJoinObj.contestGradeTitle}
                          </span>
                        )}
                      </div>

                      <div className="w-full sm:w-auto shrink-0 relative">
                        {matchGrades.length > 0 ? (
                          <div className="relative">
                            <select
                              onChange={(e) => handleEditCategorySelect(cat.contestCategoryId, cat.contestCategoryTitle, cat.contestCategoryPriceType, e)}
                              className="category-dropdown w-full sm:w-[220px] bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded pl-3 pr-8 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-accent appearance-none font-bold cursor-pointer transition-all"
                              value={selectedJoinObj ? `${selectedJoinObj.contestGradeId}|${selectedJoinObj.contestGradeTitle}` : ""}
                            >
                              <option value="">체급 선택 (신청 안 함)</option>
                              {matchGrades.map((grade) => (
                                <option 
                                  key={grade.contestGradeId} 
                                  value={`${grade.contestGradeId}|${grade.contestGradeTitle}`}
                                >
                                  {grade.contestGradeTitle}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 text-[9px] md:text-[10px]">▼</div>
                          </div>
                        ) : (
                          <span className="text-xs md:text-sm text-white/40 font-mono">N/A</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 스텝 네비게이션 */}
              <div className="pt-6 flex flex-col-reverse sm:flex-row justify-between gap-4">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="w-full sm:w-auto text-center bg-[#0a0a0a] hover:bg-[#1d1f1d] text-white border border-white/10 px-5 py-3.5 rounded text-xs font-bold transition-all cursor-pointer"
                >
                  이전 단계 (인적 정보)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingInvoice.joins?.length > 0) {
                      goToNextStep();
                    } else {
                      showAlert('최소 1개 이상의 참가 부문 및 체급을 선택하셔야 다음 단계로 가실 수 있습니다.', '신청 종목 미선택');
                    }
                  }}
                  className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    editingInvoice.joins?.length > 0
                      ? 'bg-accent text-black font-black hover:bg-white'
                      : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                  }`}
                >
                  {hasNotice ? '4단계 최종 확인으로 이동' : '3단계 최종 확인으로 이동'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PRIVACY POLICY & FINAL SUBMIT */}
          {currentStepId === 'pledge' && (
            <div className="space-y-8 transition-all duration-300">
              <div className="border-b border-white/10 pb-4 mb-6">
                <h3 className="text-base md:text-lg font-bold text-accent tracking-tight flex items-start gap-2.5 break-keep">
                  <ShieldCheck className="w-5.5 h-5.5 text-accent shrink-0 mt-0.5" />
                  <span>3. 서약 및 최종 확인서 제출</span>
                </h3>
                <p className="text-xs md:text-sm text-white/60 mt-1.5 break-keep leading-relaxed">제출 전 최종 계약 약관 동의 및 수수료 내역을 검토합니다.</p>
              </div>

              {/* REALTIME PRICE SUMMARY */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden shadow-lg relative">
                <div className="bg-white/[0.02] p-4 border-b border-white/5 flex justify-between items-center">
                  <span className="text-[10px] md:text-xs text-white/60 font-bold">참가 신청 영수증 (수정본)</span>
                  <span className="text-[9px] md:text-[10px] text-accent font-mono font-bold">YBBF 접수 시스템</span>
                </div>
                
                <div className="p-6 md:p-8 space-y-4 font-mono text-xs md:text-sm">
                  <div className="flex justify-between items-center text-white/60">
                    <span>기본 출전 참가비</span>
                    <span className="text-white font-bold">
                      {(() => {
                        const joins = editingInvoice.joins || [];
                        const hasType1 = joins.some((j: JoinItem) => j.contestCategoryPriceType === '타입1');
                        const hasType2 = joins.some((j: JoinItem) => j.contestCategoryPriceType === '타입2');
                        
                        let basePrice = Number(editingInvoice.contestPriceBasic) || 0;
                        if (joins.length > 0) {
                          if (hasType1) {
                            basePrice = Number(editingInvoice.contestPriceType1) || 0;
                          } else if (hasType2) {
                            basePrice = Number(editingInvoice.contestPriceType2) || 0;
                          }
                        }
                        return basePrice.toLocaleString();
                      })()} 원
                    </span>
                  </div>

                  {editingInvoice.joins.length > 1 && (
                    <div className="flex justify-between items-center text-white/60">
                      <span>중복 출전비 ({editingInvoice.joins.length - 1}개 추가)</span>
                      <span className="text-white font-bold">+{((editingInvoice.joins.length - 1) * (editingInvoice.contestPriceExtra || 0)).toLocaleString()} 원</span>
                    </div>
                  )}

                  {editingInvoice.playerService && (
                    <div className="flex justify-between items-center text-accent/95">
                      <span>📸 프리미엄 무대 고해상도 사진 서비스</span>
                      <span className="font-bold">+{PHOTO_SERVICE_PRICE.toLocaleString()} 원</span>
                    </div>
                  )}

                  <div className="border-t border-dashed border-white/10 my-4 pt-4"></div>

                  <div className="flex justify-between items-end">
                    <span className="text-white/60 text-xs md:text-sm font-bold">최종 납부 총액</span>
                    <div className="text-right">
                      <span className="text-2xl md:text-4xl font-display font-black italic text-accent">
                        {totalEditPrice.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PRIVACY POLICY CONSENT */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs md:text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
                  <FileCheck className="w-4 h-4 text-accent" /> 개인정보 수집·이용 및 초상권 사용 동의
                </h3>

                <div 
                  data-lenis-prevent
                  onWheel={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3.5 h-[130px] overflow-y-auto text-[10px] md:text-[11px] text-white/40 space-y-3 leading-relaxed font-sans scrollbar-thin scrollbar-thumb-white/10"
                >
                  <div>
                    <h5 className="font-bold text-white/70 mb-0.5">제1조 (개인정보의 수집 및 이용 목적)</h5>
                    <p>용인특례시보디빌딩협회(YBBF)는 대회 참가 등록 및 접수 확인, 본인 식별, 대회 당일 본부석 대형 전광판(LED) 내 프로필 사진 표출, 대회 참가 규정 및 기록 관리, 공식 중계 방송(유튜브 라이브 스트리밍 등) 송출, 보도자료 배포 목적으로 신청자의 개인정보를 수집 및 이용합니다.</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-white/70 mb-0.5">제2조 (수집하는 개인정보 항목)</h5>
                    <p>필수 수집 항목: 성명, 생년월일, 성별, 휴대전화번호, 이메일, 소속 체육관/클럽 명칭, 참가 대회 카테고리/체급 및 <strong>업로드한 선수 프로필 사진 데이터</strong></p>
                  </div>
                  <div>
                    <h5 className="font-bold text-white/70 mb-0.5">제3조 (초상권 및 대회 미디어 송출 동의)</h5>
                    <p>대회 접수 시 제출한 프로필 사진과 대회 당일 무대 퍼포먼스 과정에서 촬영되는 일체의 사진, 동영상 저작물은 본부석 LED 대형 전광판 상영, 실시간 생중계 송출, 언론 배포 및 협회 공식 홈페이지 아카이빙 목적으로 활용되며 이에 대한 초상권과 영상 사용을 협회에 전적으로 허가합니다.</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-white/70 mb-0.5">제4조 (개인정보의 보유 및 이용 기간)</h5>
                    <p>수집한 선수의 개인정보는 대회 종료 및 정산 민원 처리가 끝나는 시점으로부터 <strong>1년 간 보관 후 즉시 영구 파기</strong>합니다. 다만, 공식 시상 내역 및 참가 기록 관리를 위한 대회 대장(성명, 소속, 종목, 순위) 정보는 협회 보존 기준에 의거하여 준영구 보관됩니다.</p>
                  </div>
                  <div>
                    <h5 className="font-bold text-white/70 mb-0.5">제5조 (동의 거부 권리 및 불이익 고지)</h5>
                    <p>신청 선수는 개인정보의 수집·이용 및 초상권 허가에 대한 동의를 거부할 권리가 있습니다. 단, 본 조항들은 원활한 대회 참가 접수와 무대 심사 운영을 위한 필수 요건이므로 동의를 거부하시는 경우 대회 접수 및 출전이 불가능합니다.</p>
                  </div>
                </div>

                <div className="flex items-center py-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={policyAccepted}
                      onChange={(e) => setPolicyAccepted(e.target.checked)}
                      className="w-4 h-4 rounded text-accent bg-black border-white/20 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-xs md:text-sm text-white/80 font-bold">
                      <span className="text-accent mr-1">[필수]</span> 위 개인정보 및 방송/전광판 초상권 이용에 관한 동의서 내용을 확인했으며 이에 전적으로 동의합니다.
                    </span>
                  </label>
                </div>
              </div>

              {/* 스텝 이동 및 제출 */}
              <div className="pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row justify-between gap-4">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="w-full sm:w-auto text-center bg-[#0a0a0a] hover:bg-[#1d1f1d] text-white border border-white/10 px-5 py-3.5 rounded text-xs font-bold transition-all cursor-pointer"
                >
                  이전 단계 (종목선택)
                </button>

                {isEditingValidate && editingInvoice.joins?.length > 0 && policyAccepted ? (
                  <button 
                    type="button"
                    onClick={goToNextStep}
                    className="w-full sm:w-auto text-center bg-accent text-black font-black italic text-xs sm:text-sm tracking-widest uppercase px-8 py-3.5 rounded hover:bg-white transition-all shadow-[0_0_15px_rgba(196,255,0,0.2)] cursor-pointer"
                  >
                    수정 정보 최종 확인
                  </button>
                ) : (
                  <button 
                    type="button"
                    disabled
                    className="w-full sm:w-auto bg-white/5 text-white/30 font-bold text-[11px] sm:text-xs py-3.5 px-6 rounded cursor-not-allowed border border-white/5 text-center flex items-center justify-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0" /> 개인정보 동의 조항에 동의하셔야 수정 제출 가능합니다.
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: FINAL CHECK */}
          {currentStepId === 'confirm' && (
            <div className="space-y-8 transition-all duration-300">
              <div className="border-b border-white/10 pb-4 mb-6">
                <h3 className="text-base md:text-lg font-bold text-accent tracking-tight flex items-start gap-2.5 break-keep">
                  <ShieldCheck className="w-5.5 h-5.5 text-accent shrink-0 mt-0.5" />
                  <span>{hasNotice ? '5' : '4'}. 참가 신청 수정 정보 최종 확인</span>
                </h3>
                <p className="text-xs md:text-sm text-white/60 mt-1.5 break-keep leading-relaxed">
                  작성하신 신청 정보가 정확한지 다시 한번 최종 검토해 주시기 바랍니다. 제출 시 기존 등록된 무대 채점 테이블 및 엔트리는 초기화되며, 재검토가 완료될 때까지 입금 여부가 미확인으로 유지됩니다.
                </p>
              </div>

              {/* 메인 정보 요약 보드 */}
              <div className="space-y-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-center">
                  
                  {/* 인적 사항 그리드 */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:col-span-3 text-xs">
                    <div>
                      <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">선수명</span>
                      <span className="font-bold text-white text-sm md:text-base">{editingInvoice.playerName}</span>
                    </div>
                    <div>
                      <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">성별</span>
                      <span className="font-bold text-white text-sm md:text-base">{editingInvoice.playerGender === 'm' ? '남자' : '여자'}</span>
                    </div>
                    <div>
                      <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">생년월일</span>
                      <span className="font-bold text-white text-sm md:text-base">{editingInvoice.playerBirth}</span>
                    </div>
                    <div>
                      <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">연락처</span>
                      <span className="font-bold text-white text-sm md:text-base">{editingInvoice.playerTel}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold">소속 체육관</span>
                      <span className="font-bold text-white text-sm md:text-base">{editingInvoice.playerGym || '무소속'}</span>
                    </div>
                  </div>

                  {/* 프로필 이미지 미리보기 */}
                  <div className="flex flex-col items-center justify-center sm:border-l sm:border-white/10 sm:pl-6 gap-2 w-full sm:col-span-1 shrink-0">
                    <span className="text-white/50 block text-[10px] md:text-xs mb-1 font-semibold sm:hidden">프로필 사진</span>
                    {photosList.length > 0 ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-accent/30 shadow relative bg-[#161a16] shrink-0">
                          <img src={photosList[0].url} alt="대표 선수프로필" className="w-full h-full object-cover" />
                        </div>
                        {photosList.length > 1 ? (
                          <span className="text-[10px] text-accent font-mono tracking-tighter whitespace-nowrap">
                            대표 사진 외 {photosList.length - 1}장
                          </span>
                        ) : (
                          <span className="text-[10px] text-accent/70 font-mono tracking-tighter whitespace-nowrap">
                            대표 사진 1장
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center text-white/20 text-[10px] md:text-xs text-center shrink-0 leading-tight">
                        <span>사진 미등록</span>
                      </div>
                    )}
                    <span className="text-[10px] text-accent/70 font-mono tracking-tighter whitespace-nowrap">전광판 송출용</span>
                  </div>
                </div>

                {/* 참가 신청 종목 리스트 */}
                <div className="border-t border-white/5 pt-4">
                  <span className="text-white/50 block text-[11px] md:text-xs font-semibold mb-2">선택 참가 종목 ({editingInvoice.joins?.length}개 부문)</span>
                  <div className="space-y-1.5 font-sans">
                    {editingInvoice.joins?.map((join: JoinItem, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-white/80 font-bold text-xs md:text-sm bg-[#0a0a0a] px-3.5 py-2.5 rounded-lg border border-white/5">
                        <span className="break-keep">• {join.contestCategoryTitle}</span>
                        <span className="text-accent text-[11px] md:text-xs whitespace-nowrap bg-accent/5 px-2 py-0.5 rounded border border-accent/20">{join.contestGradeTitle}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 추가 서비스 정보 */}
                {editingInvoice.playerService && (
                  <div className="border-t border-white/5 pt-4 flex justify-between items-center text-accent text-xs font-bold bg-accent/5 -mx-6 md:-mx-10 px-6 md:px-10 py-2.5">
                    <span>📸 프리미엄 고해상도 무대 촬영 서비스 신청</span>
                    <span className="text-white">+{PHOTO_SERVICE_PRICE.toLocaleString()}원</span>
                  </div>
                )}

                {/* 최종 합계 청구액 */}
                <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                  <span className="text-white/80 text-xs sm:text-sm font-bold">최종 변경 청구 금액</span>
                  <span className="text-xl sm:text-2xl font-black text-accent">{totalEditPrice.toLocaleString()}원</span>
                </div>
              </div>

              {/* 입금 계좌 정보 */}
              <div className="bg-[#1d1f1d] border border-white/10 rounded-xl p-5 text-left mt-6">
                <h4 className="text-xs font-bold text-accent mb-2.5 flex items-center gap-2 uppercase tracking-wider font-mono">
                  <CreditCard className="w-4 h-4" /> 입금 계좌 정보 (무통장 입금)
                </h4>
                <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3.5 text-xs font-mono text-white/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">은행명</span>
                    <span className="font-bold text-white">{editingInvoice.contestBankName}</span>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-white/40 shrink-0">계좌번호</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-white select-all truncate">{editingInvoice.contestAccountNumber}</span>
                      <button 
                        type="button"
                        onClick={handleCopyAccount}
                        className="bg-white/5 hover:bg-white/10 hover:text-accent hover:border-accent/40 px-2 py-1 rounded text-white text-[10px] md:text-xs transition-all border border-white/10 flex items-center gap-1 font-sans cursor-pointer active:scale-95 shrink-0"
                        title="계좌번호 복사"
                      >
                        <Copy className="w-3 h-3" />
                        <span>복사</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">예금주</span>
                    <span className="font-bold text-accent">{editingInvoice.contestAccountOwner}</span>
                  </div>
                </div>
                {copySuccess && (
                  <p className="text-center text-[10px] text-accent mt-2 font-mono">계좌 정보가 클립보드에 복사되었습니다!</p>
                )}
              </div>

              {/* 하단 버튼 2개 */}
              <div className="pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row justify-between gap-4">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="w-full sm:w-auto text-center bg-[#0a0a0a] hover:bg-[#1d1f1d] text-white border border-white/10 px-5 py-3.5 rounded text-xs font-bold transition-all text-center cursor-pointer"
                >
                  이전 단계 (서약 및 약관)
                </button>
                <button
                  type="button"
                  onClick={handleFinalEditSubmit}
                  disabled={isSubmitting || isPhotoUploading}
                  className="w-full sm:w-auto text-center bg-accent hover:bg-white text-black font-black italic text-xs sm:text-sm tracking-widest uppercase px-8 py-3.5 rounded transition-all shadow-[0_0_15px_rgba(210,255,0,0.15)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      {isPhotoUploading ? '사진 업로드 중...' : '변경 내용 저장 중...'}
                    </>
                  ) : (
                    '참가 신청 정보 변경 완료'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
