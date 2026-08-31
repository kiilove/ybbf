import React, { useState } from 'react';
import { 
  CheckCircle, 
  Edit2, 
  Upload, 
  Video,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Camera,
  Share2
} from 'lucide-react';
import { RegistrationPayload, JoinItem } from '../../types/registration';
import { AthleteIntroModal } from '../broadcast/AthleteIntroModal';

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
  // 접수 정보 vs 사진 갤러리 서브 탭 상태
  const [activeTab, setActiveTab] = useState<'photos' | 'info'>('photos');
  const [isIntroModalOpen, setIsIntroModalOpen] = useState<boolean>(false);

  // 브라우저 직접 다운로드 헬퍼
  const handleDirectDownload = async (e: React.MouseEvent, url: string, filename: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(url, { mode: 'cors' });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const displaySlot1 = inv.publicStagePhoto1 || inv.stagePhoto1;
  const displaySlot2 = inv.publicStagePhoto2 || inv.stagePhoto2;
  const isBranded1 = Boolean(inv.publicStagePhoto1);
  const isBranded2 = Boolean(inv.publicStagePhoto2);

  const stagePhotos = [
    inv.stagePhoto1,
    inv.stagePhoto2,
    inv.publicStagePhoto1,
    inv.publicStagePhoto2
  ].filter(Boolean) as string[];

  const rawPool = (inv.playerPhotoUrls && inv.playerPhotoUrls.length > 0)
    ? inv.playerPhotoUrls
    : (inv.playerPhotoUrl ? [inv.playerPhotoUrl] : []);

  const filteredPool = rawPool.filter(url => !stagePhotos.includes(url));
  const displayPool = filteredPool.length > 0 ? filteredPool : rawPool;

  return (
    <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-accent/40 group">
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. 대회 메인 헤더 (타이틀 & 결제 금액) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 pb-5 border-b border-white/10">
        <div>
          <span className="text-xs md:text-sm text-accent font-bold block mb-1">
            {inv.contestDate} • {inv.contestLocation}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {inv.contestTitle}
          </h3>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] md:text-xs text-white/40 font-mono block">결제 금액</span>
          <span className="text-2xl sm:text-3xl font-display font-black italic text-accent">
            {(inv.contestPriceTotal || 0).toLocaleString()}원
          </span>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2. 서브 탭 전환 네비게이션 (무대 사진 갤러리 vs 접수 정보) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex items-center gap-2 mb-6 p-1.5 bg-[#141414] border border-white/10 rounded-xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('photos')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'photos'
              ? 'bg-[#d2ff00] text-black shadow-lg shadow-[#d2ff00]/20 font-black'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Camera className={`w-4 h-4 ${activeTab === 'photos' ? 'text-black' : 'text-[#d2ff00]'}`} />
          <span>무대 사진 갤러리 (공식 브랜딩)</span>
          {(isBranded1 || isBranded2) && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeTab === 'photos' ? 'bg-black/20 text-black' : 'bg-[#d2ff00]/20 text-[#d2ff00]'
            }`}>
              완료
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'info'
              ? 'bg-white text-black shadow-lg shadow-white/20 font-black'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>신청 및 접수 상세 내역</span>
        </button>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3. [TAB 1: 무대 사진 & 프로필 갤러리 뷰] - 가로 전체를 시원하게 활용 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          {/* 무대용 공식 브랜딩 사진 2종 카드 */}
          <div className="bg-[#121913] border border-[#d2ff00]/30 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-white/10">
              <div>
                <h4 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#d2ff00]" />
                  공식 무대 지정 사진 (YBBF.ORG 브랜딩)
                </h4>
                <p className="text-xs text-white/50 mt-1">
                  대회 LED 전광판 송출 및 공식 SNS/인증용으로 완성된 고화질 브랜딩 사진입니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                {/* 실제 무대 LED 송출 인트로 시뮬레이션 버튼 */}
                <button
                  type="button"
                  onClick={() => setIsIntroModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#d2ff00] via-[#a3e635] to-[#10b981] hover:brightness-110 text-black font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-[#d2ff00]/25 cursor-pointer"
                  title="실제 대회 무대 LED 전광판에 표출된 선수 인트로 애니메이션 재생"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>무대 LED 송출 영상 보기</span>
                </button>

                {/* 선수 전용 공식 쇼케이스 공유 페이지 바로가기 */}
                <a
                  href={`/showcase/${encodeURIComponent(inv.id || inv.playerUid || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-white/15 cursor-pointer"
                  title="내 무대 사진 공개 쇼케이스 페이지 열기 및 SNS 공유"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#d2ff00]" />
                  <span>쇼케이스 공유</span>
                </a>

                <span className="text-xs font-mono font-bold text-[#d2ff00] bg-[#d2ff00]/15 border border-[#d2ff00]/30 px-3 py-1.5 rounded-xl">
                  {isBranded1 || isBranded2 ? '브랜딩 완성' : (displaySlot1 || displaySlot2 ? '지정완료' : '미지정')}
                </span>
              </div>
            </div>

            {/* 시원한 2열 와이드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 🏆 1번 메인 사진 */}
              <div className="flex flex-col bg-[#0a0f0b] border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-black text-[#34d399] font-mono flex items-center gap-1.5">
                    🏆 무대 1번 (메인 포즈 컷)
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">16:9 메인 송출용</span>
                </div>

                {displaySlot1 ? (
                  <div className="space-y-3">
                    <div 
                      onClick={() => setActiveLightboxMedia({ type: 'image', url: displaySlot1 })}
                      className="relative w-full aspect-[16/10] sm:aspect-video rounded-xl overflow-hidden border-2 border-[#10b981] bg-[#000] cursor-pointer group/s1 shadow-xl shadow-[#10b981]/15 transition-all duration-200 hover:scale-[1.01]"
                      title="클릭하여 큰 화면으로 미리보기"
                    >
                      <img 
                        src={displaySlot1} 
                        alt="무대 1번 사진" 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/s1:scale-105" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/s1:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-black/80 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20 shadow-lg">
                          <Eye className="w-4 h-4 text-[#34d399]" /> 큰 화면으로 보기
                        </span>
                      </div>
                      <span className="absolute top-2.5 left-2.5 bg-[#10b981] text-black text-[10px] font-black px-2.5 py-0.5 rounded shadow">
                        MAIN SLOT
                      </span>
                    </div>

                    {/* 분리된 2대 액션 버튼 */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveLightboxMedia({ type: 'image', url: displaySlot1 })}
                        className="py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-white/15 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-[#34d399]" />
                        <span>미리보기</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDirectDownload(e, displaySlot1, `ybbf_${inv.playerName}_stage1.jpg`)}
                        className="py-2.5 bg-[#10b981] hover:bg-[#34d399] text-black rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-[#10b981]/20"
                      >
                        <Download className="w-4 h-4" />
                        <span>다운로드</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[16/10] sm:aspect-video rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center text-xs text-white/40 text-center p-4">
                    <span>무대 1번 사진 미등록</span>
                  </div>
                )}
              </div>

              {/* 🥈 2번 액션 사진 */}
              <div className="flex flex-col bg-[#0a0f0b] border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-black text-[#60a5fa] font-mono flex items-center gap-1.5">
                    🥈 무대 2번 (액션 포즈 컷)
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">16:9 서브 송출용</span>
                </div>

                {displaySlot2 ? (
                  <div className="space-y-3">
                    <div 
                      onClick={() => setActiveLightboxMedia({ type: 'image', url: displaySlot2 })}
                      className="relative w-full aspect-[16/10] sm:aspect-video rounded-xl overflow-hidden border-2 border-[#3b82f6] bg-[#000] cursor-pointer group/s2 shadow-xl shadow-[#3b82f6]/15 transition-all duration-200 hover:scale-[1.01]"
                      title="클릭하여 큰 화면으로 미리보기"
                    >
                      <img 
                        src={displaySlot2} 
                        alt="무대 2번 사진" 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/s2:scale-105" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/s2:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-black/80 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20 shadow-lg">
                          <Eye className="w-4 h-4 text-[#60a5fa]" /> 큰 화면으로 보기
                        </span>
                      </div>
                      <span className="absolute top-2.5 left-2.5 bg-[#3b82f6] text-white text-[10px] font-black px-2.5 py-0.5 rounded shadow">
                        ACTION SLOT
                      </span>
                    </div>

                    {/* 분리된 2대 액션 버튼 */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setActiveLightboxMedia({ type: 'image', url: displaySlot2 })}
                        className="py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-white/15 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-[#60a5fa]" />
                        <span>미리보기</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDirectDownload(e, displaySlot2, `ybbf_${inv.playerName}_stage2.jpg`)}
                        className="py-2.5 bg-[#3b82f6] hover:bg-[#60a5fa] text-white rounded-lg text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-[#3b82f6]/20"
                      >
                        <Download className="w-4 h-4" />
                        <span>다운로드</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[16/10] sm:aspect-video rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center text-xs text-white/40 text-center p-4">
                    <span>무대 2번 사진 미등록</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* 등록된 기본 프로필 사진 풀 */}
          <div className="bg-[#111111] border border-white/5 rounded-xl p-4 sm:p-5">
            <span className="text-xs text-white/60 block mb-3 font-bold">
              📷 접수 등록 프로필 사진 ({displayPool.length}장)
            </span>
            <div className="flex flex-wrap gap-3">
              {displayPool.length > 0 ? (
                displayPool.map((url: string, i: number) => (
                  <button 
                    key={i}
                    type="button"
                    onClick={() => setActiveLightboxMedia({ type: 'image', url })}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-white/15 hover:border-accent transition-all duration-200 block bg-[#161a16] shrink-0 group/photo hover:scale-[1.06] text-left cursor-pointer shadow-md"
                    title="크게 보기"
                  >
                    <img src={url} alt={`프로필 사진 ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-accent text-black text-[9px] font-black text-center py-0.5 leading-none">
                        대표
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <button 
                  type="button"
                  onClick={() => handleEditClickWithWarning(inv)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-dashed border-accent/40 bg-accent/5 hover:bg-accent/20 hover:border-accent flex flex-col items-center justify-center text-[10px] text-accent font-bold text-center leading-tight transition-all duration-200 cursor-pointer group/nophoto shrink-0"
                  title="클릭하여 프로필 사진 바로 등록하기"
                >
                  <Upload className="w-4 h-4 mb-1 text-accent group-hover/nophoto:scale-110 transition-transform" />
                  <span>등록하기</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 4. [TAB 2: 대회 접수 및 계측 상세 내역] */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            
            {/* 좌측: 신청 종목 내역 */}
            <div className="bg-[#111111] border border-white/5 rounded-xl p-5">
              <span className="text-xs font-bold text-white/50 block mb-3 uppercase tracking-wider">신청 종목 내역</span>
              <div className="space-y-2">
                {inv.joins && Array.isArray(inv.joins) && inv.joins.map((join: JoinItem, idx: number) => (
                  <div key={idx} className="bg-[#181818] border border-white/5 px-4 py-3 rounded-lg flex justify-between items-center text-sm">
                    <span className="font-bold text-white">• {join.contestCategoryTitle}</span>
                    <span className="text-accent font-mono text-xs border border-accent/30 bg-accent/10 px-3 py-1 rounded-md font-bold">
                      {join.contestGradeTitle}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 우측: 접수 식별 및 상태 정보 */}
            <div className="bg-[#111111] border border-white/5 rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="bg-[#181818] p-3 rounded-lg border border-white/5">
                  <span className="text-white/40 block mb-1">접수 식별 코드</span>
                  <span className="font-mono text-accent font-bold text-xs sm:text-sm select-all">
                    {inv.id?.startsWith('inv_') 
                      ? `YBBF-${inv.id.replace('inv_', '').substring(0, 8).toUpperCase()}` 
                      : (inv.id || '확인중')}
                  </span>
                </div>
                <div className="bg-[#181818] p-3 rounded-lg border border-white/5">
                  <span className="text-white/40 block mb-1">제출일자</span>
                  <span className="text-white font-bold">{formatDisplayDate(inv.submittedAt, inv.invoiceCreateAt)}</span>
                </div>
              </div>

              {/* 사전계측 증빙 자료 */}
              <div className="border-t border-white/5 pt-3">
                <span className="text-xs text-white/40 block mb-2 font-bold">사전계측 증빙 자료</span>
                {preMeasurementStatuses[inv.contestId]?.submitted ? (
                  <div className="flex items-center gap-3">
                    {preMeasurementStatuses[inv.contestId].data?.mediaType === 'video' ? (
                      <button
                        type="button"
                        onClick={() => setActiveLightboxMedia({
                          type: 'video',
                          url: preMeasurementStatuses[inv.contestId].data.mediaUrl
                        })}
                        className="w-14 h-14 rounded-lg border border-accent/30 bg-[#2d4a1f]/20 hover:border-accent flex flex-col items-center justify-center text-[10px] text-accent font-bold cursor-pointer"
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
                        className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 hover:border-accent block cursor-pointer"
                      >
                        <img
                          src={preMeasurementStatuses[inv.contestId].data.mediaUrl}
                          alt="사전계측 사진"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}
                    <span className="text-xs text-accent font-mono font-bold bg-[#2d4a1f]/20 border border-accent/20 px-2.5 py-1 rounded-md">
                      제출 완료됨
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-white/30 italic">아직 제출된 사전계측 자료가 없습니다.</div>
                )}
              </div>
            </div>

          </div>

          {/* 하단 입금 상태 및 신청 변경 액션 바 */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#141414] border border-white/5 rounded-xl">
            <span className={`px-4 py-2 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 ${
              inv.isPriceCheck 
                ? 'bg-accent/10 border-accent/30 text-accent' 
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            }`}>
              <CheckCircle className="w-4 h-4" />
              입금 확인: {inv.isPriceCheck ? '입금 확인 완료' : '입금 확정 대기'}
            </span>
            
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate(`/pre-measurement?contestId=${inv.contestId}`)}
                className="flex items-center gap-1.5 border border-white/20 bg-white/5 hover:bg-accent hover:text-black hover:border-accent text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                사전계측 자료 제출
              </button>
              <button
                type="button"
                onClick={() => handleEditClickWithWarning(inv)}
                className="flex items-center gap-1.5 border border-accent/30 bg-accent/5 hover:bg-accent hover:text-black hover:border-accent text-accent px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                참가신청 정보 변경
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 무통장 입금 계좌 정보 (미입금 시) */}
      {!inv.isPriceCheck && inv.contestBankName && inv.contestAccountNumber && (
        <div className="mt-5 p-5 bg-[#050805] border border-accent/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
          <div className="space-y-2">
            <span className="text-white/40 block text-xs font-bold uppercase tracking-wider">무통장 입금 계좌 안내</span>
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

      {/* Live Stage Intro Fullscreen Modal */}
      <AthleteIntroModal
        isOpen={isIntroModalOpen}
        onClose={() => setIsIntroModalOpen(false)}
        player={inv}
      />
    </div>
  );
}
