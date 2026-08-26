import React from 'react';
import { 
  CheckCircle, 
  Edit2, 
  Sparkles, 
  Upload, 
  Video 
} from 'lucide-react';
import { RegistrationPayload, JoinItem } from '../../types/registration';

interface MyPageRegistrationCardProps {
  key?: string;
  inv: RegistrationPayload;
  preMeasurementStatuses: Record<string, { submitted: boolean; data?: any }>;
  setActiveLightboxMedia: (media: { type: 'image' | 'video'; url: string } | null) => void;
  handleEditClickWithWarning: (inv: RegistrationPayload) => void;
  navigate: (path: string) => void;
  formatDisplayDate: (isoStr?: string, localStr?: string) => string;
}

export function MyPageRegistrationCard({
  inv,
  preMeasurementStatuses,
  setActiveLightboxMedia,
  handleEditClickWithWarning,
  navigate,
  formatDisplayDate,
}: MyPageRegistrationCardProps) {
  return (
    <div
      className="bg-[#0c0c0c] border border-white/5 rounded-xl p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:border-accent/30 group"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-white/5">
        <div>
          <span className="text-xs md:text-sm text-accent font-bold block mb-1">
            {inv.contestDate} • {inv.contestLocation}
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
            {inv.contestTitle}
          </h3>
        </div>
        <div className="text-right sm:text-right shrink-0">
          <span className="text-[10px] md:text-xs text-white/40 font-mono block">결제 금액</span>
          <span className="text-xl sm:text-2xl font-display font-black italic text-accent">
            {(inv.contestPriceTotal || 0).toLocaleString()}원
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div>
          <span className="text-xs text-white/40 block mb-1.5">신청 상세 종목</span>
          <div className="space-y-1">
            {inv.joins && Array.isArray(inv.joins) && inv.joins.map((join: JoinItem, idx: number) => (
              <div key={idx} className="bg-[#0a0a0a] border border-white/5 px-3.5 py-2.5 rounded flex justify-between items-center text-xs sm:text-sm">
                <span className="font-bold">• {join.contestCategoryTitle}</span>
                <span className="text-accent font-mono text-[11px] border border-accent/20 bg-accent/5 px-2.5 py-0.5 rounded font-bold">
                  {join.contestGradeTitle}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 등록 사진 및 사전계측 자료 통합 컬럼 */}
        <div className="border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 flex flex-col space-y-4">
          <div>
            <span className="text-xs text-white/40 block mb-2">등록 프로필 사진 ({((inv.playerPhotoUrls && inv.playerPhotoUrls.length) || (inv.playerPhotoUrl ? 1 : 0))}장)</span>
            <div className="flex flex-wrap gap-2.5">
              {inv.playerPhotoUrls && inv.playerPhotoUrls.length > 0 ? (
                inv.playerPhotoUrls.map((url: string, i: number) => (
                  <button 
                    key={i}
                    type="button"
                    onClick={() => setActiveLightboxMedia({ type: 'image', url })}
                    className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10 hover:border-accent transition-all duration-200 block bg-[#161a16] shrink-0 group/photo hover:scale-[1.05] text-left"
                    title="크게 보기"
                  >
                    <img src={url} alt={`선수 사진 ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-accent text-black text-[8px] font-black text-center py-0.5 leading-none">
                        대표
                      </span>
                    )}
                  </button>
                ))
              ) : inv.playerPhotoUrl ? (
                <button 
                  type="button"
                  onClick={() => setActiveLightboxMedia({ type: 'image', url: inv.playerPhotoUrl! })}
                  className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10 hover:border-accent transition-all duration-200 block bg-[#161a16] shrink-0 hover:scale-[1.05] text-left"
                  title="크게 보기"
                >
                  <img src={inv.playerPhotoUrl} alt="선수 사진" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 left-0 right-0 bg-accent text-black text-[8px] font-black text-center py-0.5 leading-none">
                    대표
                  </span>
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => handleEditClickWithWarning(inv)}
                  className="w-14 h-14 rounded-lg border border-dashed border-accent/40 bg-accent/5 hover:bg-accent/20 hover:border-accent flex flex-col items-center justify-center text-[10px] text-accent font-bold text-center leading-tight transition-all duration-200 cursor-pointer group/nophoto shrink-0 shadow-sm shadow-accent/5 hover:scale-[1.05]"
                  title="클릭하여 프로필 사진 바로 등록하기"
                >
                  <Upload className="w-3.5 h-3.5 mb-0.5 text-accent group-hover/nophoto:scale-110 transition-transform" />
                  <span>사진 등록</span>
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 flex flex-col">
            <span className="text-xs text-white/40 block mb-2">사전계측 증빙 자료</span>
            {preMeasurementStatuses[inv.contestId]?.submitted ? (
              <div className="flex flex-wrap items-center gap-2.5">
                {preMeasurementStatuses[inv.contestId].data?.mediaType === 'video' ? (
                  <button
                    type="button"
                    onClick={() => setActiveLightboxMedia({
                      type: 'video',
                      url: preMeasurementStatuses[inv.contestId].data.mediaUrl
                    })}
                    className="w-14 h-14 rounded-lg border border-accent/20 bg-[#2d4a1f]/10 hover:border-accent hover:scale-[1.05] transition-all duration-200 flex flex-col items-center justify-center text-[10px] text-accent font-bold shrink-0 cursor-pointer"
                    title="동영상 보기"
                  >
                    <Video className="w-5 h-5 mb-0.5 text-accent" />
                    <span>비디오</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveLightboxMedia({
                      type: 'image',
                      url: preMeasurementStatuses[inv.contestId].data.mediaUrl
                    })}
                    className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10 hover:border-accent hover:scale-[1.05] transition-all duration-200 block bg-[#161a16] shrink-0 cursor-pointer"
                    title="사진 크게 보기"
                  >
                    <img
                      src={preMeasurementStatuses[inv.contestId].data.mediaUrl}
                      alt="사전계측 사진"
                      className="w-full h-full object-cover"
                    />
                  </button>
                )}
                <span className="text-[9px] text-accent font-mono font-bold bg-[#2d4a1f]/20 border border-accent/20 px-2 py-0.5 rounded uppercase tracking-wider">
                  제출완료
                </span>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-lg border border-dashed border-white/15 flex items-center justify-center text-[10px] text-white/25 text-center leading-tight">
                미제출
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3.5 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
            <div>
              <span className="text-white/40 block mb-0.5">접수 번호</span>
              <span className="font-mono text-white/80 font-bold select-all break-all">{inv.id}</span>
            </div>
            <div>
              <span className="text-white/40 block mb-0.5">제출일자</span>
              <span className="text-white/80 font-bold">{formatDisplayDate(inv.submittedAt, inv.invoiceCreateAt)}</span>
            </div>
          </div>

          {/* Status Check badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-2 text-xs font-mono font-bold w-full">
            <span className={`px-3 py-1.5 rounded border flex items-center gap-1.5 ${
              inv.isPriceCheck 
                ? 'bg-accent/10 border-accent/30 text-accent' 
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            }`}>
              <CheckCircle className="w-4 h-4" />
              입금여부: {inv.isPriceCheck ? '확인완료' : '확정대기'}
            </span>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(`/pre-measurement?contestId=${inv.contestId}`)}
                className="flex items-center gap-1.5 border border-white/20 bg-white/5 hover:bg-accent hover:text-black hover:border-accent text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans"
              >
                <Sparkles className="w-3.5 h-3.5" />
                사전계측 자료 제출
              </button>
              <button
                type="button"
                onClick={() => handleEditClickWithWarning(inv)}
                className="flex items-center gap-1.5 border border-accent/30 bg-accent/5 hover:bg-accent hover:text-black hover:border-accent text-accent px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans"
              >
                <Edit2 className="w-3.5 h-3.5" />
                참가신청 변경
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit bank details for pending payment */}
      {!inv.isPriceCheck && inv.contestBankName && inv.contestAccountNumber && (
        <div className="mt-5 p-5 bg-[#020202] border border-white/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
          <div className="space-y-2">
            <span className="text-white/40 block text-xs font-bold uppercase tracking-wider">무통장 입금 계좌 정보</span>
            <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
              <span className="text-accent font-black text-base sm:text-lg">{inv.contestBankName}</span>
              <span className="text-white font-mono text-base sm:text-lg font-bold select-all">{inv.contestAccountNumber}</span>
              <span className="text-white/60 text-xs sm:text-sm font-semibold">(예금주: 용인시보디빌딩협회)</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(inv.contestAccountNumber || '');
              alert('계좌번호가 복사되었습니다!');
            }}
            className="px-4 py-2.5 bg-accent/10 hover:bg-accent hover:text-black border border-accent/20 hover:border-accent text-accent text-xs sm:text-sm font-black rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            계좌번호 복사
          </button>
        </div>
      )}
    </div>
  );
}
