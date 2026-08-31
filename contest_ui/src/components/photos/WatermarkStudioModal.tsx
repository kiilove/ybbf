import { useState, useEffect, useRef } from 'react';
import { 
  X, Sparkles, CheckCircle2, Download, 
  Upload, RefreshCw, Layers, ZoomIn
} from 'lucide-react';
import type { Registration } from '../../services/contestService';
import type { 
  BrandingOptions, 
  BrandingPreset, 
  BrandingPosition 
} from '../../utils/watermarkEngine';
import { 
  processWatermarkBranding, 
  DEFAULT_OPTIONS 
} from '../../utils/watermarkEngine';
import { uploadToR2 } from '../../services/uploadToR2Service';

interface WatermarkStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  registration: Registration;
  onSaveSuccess: (updatedRegistration: Registration) => void;
}

export default function WatermarkStudioModal({
  isOpen,
  onClose,
  imageUrl,
  registration,
  onSaveSuccess
}: WatermarkStudioModalProps) {
  const [options, setOptions] = useState<BrandingOptions>({ ...DEFAULT_OPTIONS });
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'compare'>('preview');

  const [zoomMode, setZoomMode] = useState<'fit' | '100' | '150' | 'focus'>('fit');
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // 실시간 렌더링 트리거
  useEffect(() => {
    console.log('🪄 [WatermarkStudioModal 상태]', { isOpen, imageUrl, playerName: registration?.playerName });
    if (!isOpen || !imageUrl) return;

    let isMounted = true;
    const render = async () => {
      setIsProcessing(true);
      console.log('🪄 [Canvas 브랜딩 가공 시작]', { imageUrl, options });
      try {
        const result = await processWatermarkBranding(imageUrl, options);
        if (isMounted) {
          console.log('✅ [Canvas 브랜딩 가공 완료]', { 
            dataUrlLength: result.dataUrl.length, 
            blobSize: result.blob.size 
          });
          setPreviewDataUrl(result.dataUrl);
          setProcessedFile(result.file);
        }
      } catch (err) {
        console.error('🚨 [워터마크 브랜딩 처리 실패]:', err);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };

    const timer = setTimeout(render, 50);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, imageUrl, options]);

  if (!isOpen) return null;

  // R2 업로드 및 공개용(Public Branded) 컬럼 저장 핸들러
  const handleSavePublicPhoto = async (targetPublicSlot?: 1 | 2) => {
    if (!processedFile) return;

    setIsSaving(true);
    try {
      const playerIdentifier = registration.playerUid || registration.playerTel || registration.id;
      const uploadedR2Url = await uploadToR2(processedFile, `contest_player_${playerIdentifier}_public`, true);

      if (!uploadedR2Url) {
        throw new Error('R2 서버에서 반환된 이미지 URL이 없습니다.');
      }

      const currentPublicPhotos: string[] = [];
      const sourcePublic = registration.publicPhotoUrls || [];
      sourcePublic.forEach(url => {
        if (url && !currentPublicPhotos.includes(url)) currentPublicPhotos.push(url);
      });
      if (!currentPublicPhotos.includes(uploadedR2Url)) {
        currentPublicPhotos.push(uploadedR2Url);
      }

      let pubSlot1 = registration.publicStagePhoto1 || '';
      let pubSlot2 = registration.publicStagePhoto2 || '';

      if (targetPublicSlot === 1) {
        pubSlot1 = uploadedR2Url;
        if (pubSlot2 === uploadedR2Url) pubSlot2 = '';
      } else if (targetPublicSlot === 2) {
        pubSlot2 = uploadedR2Url;
        if (pubSlot1 === uploadedR2Url) pubSlot1 = '';
      } else {
        if (!pubSlot1) pubSlot1 = uploadedR2Url;
        else if (!pubSlot2 && pubSlot1 !== uploadedR2Url) pubSlot2 = uploadedR2Url;
      }

      const updatedReg: Registration = {
        ...registration,
        publicStagePhoto1: pubSlot1,
        publicStagePhoto2: pubSlot2,
        publicPhotoUrls: currentPublicPhotos,
      };

      onSaveSuccess(updatedReg);
      onClose();
    } catch (err: any) {
      alert('공개용 사진 R2 저장 오류: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setIsSaving(false);
    }
  };

  // 로컬 다운로드 핸들러
  const handleDownload = () => {
    if (!previewDataUrl) return;
    const a = document.createElement('a');
    a.href = previewDataUrl;
    a.download = `branded_${registration.playerName}_ybbf.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      style={{ zIndex: 99999 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-lg flex items-center justify-center p-2 sm:p-4 font-sans"
    >
      <div className="bg-[#0f1410] border border-[#2d4a1f] rounded-2xl w-[96vw] max-w-[1550px] h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-3.5 bg-[#141b14] border-b border-[#2d4a1f]/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  워터마크 마스킹 & <span className="text-accent">ybbf.org 브랜딩 스튜디오</span>
                </h3>
                <span className="text-[10px] bg-accent/10 border border-accent/30 text-accent px-2 py-0.5 rounded font-mono font-bold">
                  PRO STUDIO
                </span>
              </div>
              <p className="text-xs text-white/50">
                선수: <strong className="text-white">{registration.playerName}</strong> • 원본은 보존되며, 선수 공개/다운로드용 브랜딩 사진을 제작합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isProcessing && (
              <span className="text-xs text-accent flex items-center gap-1.5 font-mono animate-pulse bg-accent/10 px-3 py-1 rounded-lg border border-accent/20">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> 실시간 렌더링 중...
              </span>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (CANVAS WORKBENCH + RIGHT CONTROLS) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* LEFT: EXPANDED WORKBENCH CANVAS AREA */}
          <div className="flex-1 bg-[#060806] flex flex-col relative overflow-hidden border-b lg:border-b-0 lg:border-r border-[#2d4a1f]/40">
            
            {/* WORKBENCH TOP TOOLBAR */}
            <div className="px-5 py-2.5 bg-[#121813] border-b border-[#2d4a1f]/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Tab Selector */}
              <div className="bg-[#1a231b] border border-white/10 rounded-xl p-1 flex items-center gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'preview' ? 'bg-accent text-black shadow-md' : 'text-white/60 hover:text-white'
                  }`}
                >
                  가공 프리뷰 (Branded)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('compare')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'compare' ? 'bg-accent text-black shadow-md' : 'text-white/60 hover:text-white'
                  }`}
                >
                  좌우 비교 (Compare)
                </button>
              </div>

              {/* Zoom & View Controls */}
              <div className="flex items-center gap-1.5 bg-[#1a231b] border border-white/10 rounded-xl p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setZoomMode('fit')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    zoomMode === 'fit' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                  }`}
                  title="화면 전체에 꽉 채우기"
                >
                  화면맞춤 (Fit)
                </button>
                <button
                  type="button"
                  onClick={() => setZoomMode('100')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    zoomMode === '100' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                  }`}
                  title="100% 실제 크기"
                >
                  100% (원래크기)
                </button>
                <button
                  type="button"
                  onClick={() => setZoomMode('150')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    zoomMode === '150' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                  }`}
                  title="150% 확대 작업"
                >
                  150% 확대
                </button>
                <button
                  type="button"
                  onClick={() => setZoomMode('focus')}
                  className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer flex items-center gap-1 ${
                    zoomMode === 'focus' ? 'bg-[#d2ff00] text-black shadow-sm' : 'text-accent hover:bg-accent/10'
                  }`}
                  title="우측 하단 워터마크 가림 부위 클로즈업"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  🎯 워터마크 집중 뷰
                </button>
              </div>
            </div>

            {/* MAIN CANVAS STAGE (SCROLLABLE & ZOOMABLE) */}
            <div 
              ref={canvasContainerRef}
              className="flex-1 w-full h-full overflow-auto flex items-center justify-center p-4 bg-[radial-gradient(#1f2e1c_1px,transparent_1px)] [background-size:16px_16px]"
            >
              {activeTab === 'preview' ? (
                <div 
                  className={`relative rounded-xl overflow-hidden border border-white/20 shadow-2xl bg-[#000] transition-all duration-200 ${
                    zoomMode === 'fit' ? 'max-w-full max-h-[72vh] flex items-center justify-center' : ''
                  }`}
                  style={
                    zoomMode === 'focus' 
                      ? { 
                          transform: 'scale(2.2)', 
                          transformOrigin: 'bottom right',
                          maxHeight: '68vh',
                          maxWidth: '90%'
                        } 
                      : zoomMode === '150'
                      ? { transform: 'scale(1.5)', transformOrigin: 'center' }
                      : {}
                  }
                >
                  {previewDataUrl ? (
                    <img 
                      src={previewDataUrl} 
                      alt="브랜딩 가공 결과" 
                      className={`block mx-auto ${
                        zoomMode === 'fit' 
                          ? 'max-h-[70vh] max-w-full object-contain' 
                          : zoomMode === '100'
                          ? 'max-h-none max-w-none'
                          : 'max-h-[70vh] object-contain'
                      }`}
                    />
                  ) : (
                    <div className="w-96 h-96 flex flex-col items-center justify-center text-white/40 gap-3 font-mono text-xs">
                      <RefreshCw className="w-8 h-8 animate-spin text-accent" />
                      <span>고해상도 캔버스 렌더링 중...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6 w-full max-w-[1300px] max-h-[74vh] items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      <span className="text-xs font-black text-white/80 font-mono">1. 원본 사진 (Gemini 워터마크)</span>
                    </div>
                    <div className="relative rounded-xl overflow-hidden border border-red-500/40 bg-[#000] shadow-2xl max-h-[66vh] flex items-center justify-center">
                      <img src={imageUrl} alt="원본" className="max-h-[64vh] max-w-full object-contain" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                      <span className="text-xs font-black text-accent font-mono">2. ybbf.org 브랜딩 가공본</span>
                    </div>
                    <div className="relative rounded-xl overflow-hidden border-2 border-accent/60 bg-[#000] shadow-2xl shadow-accent/20 max-h-[66vh] flex items-center justify-center">
                      <img src={previewDataUrl} alt="가공본" className="max-h-[64vh] max-w-full object-contain" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: CONTROL SETTINGS PANEL */}
          <div className="w-full lg:w-[380px] bg-[#121713] p-5 overflow-y-auto space-y-5 shrink-0 font-sans text-xs">
            
            {/* 1. BRANDING PRESET SELECTION */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-accent mb-2 font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                브랜딩 디자인 스타일 프리셋
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'neon_badge', label: '🟢 네온 사이버 뱃지', desc: '시그니처 네온 라임' },
                  { id: 'glass_pill', label: '⚪ 글래스 캡슐', desc: '미니멀 반투명' },
                  { id: 'official_stamp', label: '🏷️ 공식 2단 스탬프', desc: '협회 영문명 포함' },
                  { id: 'subtle_text', label: '📝 서브틀 텍스트', desc: '그림자 워터마크' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setOptions({ ...options, preset: p.id as BrandingPreset })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      options.preset === p.id 
                        ? 'border-accent bg-accent/10 text-white shadow-md' 
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20'
                    }`}
                  >
                    <span className="block font-bold text-xs">{p.label}</span>
                    <span className="text-[10px] text-white/40 block mt-0.5">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. TEXT INPUT */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5 font-mono">
                오버레이 브랜딩 텍스트
              </label>
              <input 
                type="text"
                value={options.text || ''}
                onChange={(e) => setOptions({ ...options, text: e.target.value })}
                placeholder="ybbf.org"
                className="w-full bg-[#0a0d0a] border border-white/15 focus:border-accent rounded-lg px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none transition-colors"
              />
            </div>

            {/* 3. POSITION SELECTION */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2 font-mono">
                위치 지정 (워터마크 위치)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'bottom-right', label: '↘ 우측 하단 (추천/워터마크)' },
                  { id: 'bottom-left', label: '↙ 좌측 하단' },
                  { id: 'top-right', label: '↗ 우측 상단' },
                  { id: 'center-bottom', label: '⬇ 중앙 하단' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setOptions({ ...options, position: pos.id as BrandingPosition })}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-center ${
                      options.position === pos.id 
                        ? 'border-accent bg-accent text-black font-black' 
                        : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. FINE-TUNING SLIDERS */}
            <div className="space-y-3.5 bg-[#0a0d0a] border border-white/10 rounded-xl p-4">
              <span className="block font-bold text-[11px] uppercase tracking-wider text-white/60 font-mono">
                세부 조절 (Fine-Tuning)
              </span>

              {/* 폰트 크기 */}
              <div>
                <div className="flex justify-between text-[11px] mb-1 text-white/70 font-mono">
                  <span>텍스트 크기:</span>
                  <span className="text-accent font-bold">{options.fontSize}px</span>
                </div>
                <input 
                  type="range"
                  min="14"
                  max="36"
                  value={options.fontSize}
                  onChange={(e) => setOptions({ ...options, fontSize: Number(e.target.value) })}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>

              {/* 워터마크 마스킹 강도 */}
              <div>
                <div className="flex justify-between text-[11px] mb-1 text-white/70 font-mono">
                  <span>워터마크 가림 강도:</span>
                  <span className="text-accent font-bold">{Math.round((options.maskIntensity || 0.9) * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.02"
                  value={options.maskIntensity}
                  onChange={(e) => setOptions({ ...options, maskIntensity: Number(e.target.value) })}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>

              {/* 투명도 */}
              <div>
                <div className="flex justify-between text-[11px] mb-1 text-white/70 font-mono">
                  <span>오버레이 불투명도:</span>
                  <span className="text-accent font-bold">{Math.round((options.opacity || 0.95) * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.4"
                  max="1.0"
                  step="0.05"
                  value={options.opacity}
                  onChange={(e) => setOptions({ ...options, opacity: Number(e.target.value) })}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>

              {/* 여백 조절 */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex justify-between text-[10px] mb-1 text-white/60 font-mono">
                    <span>가로 여백:</span>
                    <span className="text-white font-bold">{options.offsetX}px</span>
                  </div>
                  <input 
                    type="range"
                    min="10"
                    max="60"
                    value={options.offsetX}
                    onChange={(e) => setOptions({ ...options, offsetX: Number(e.target.value) })}
                    className="w-full accent-accent cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-1 text-white/60 font-mono">
                    <span>세로 여백:</span>
                    <span className="text-white font-bold">{options.offsetY}px</span>
                  </div>
                  <input 
                    type="range"
                    min="10"
                    max="60"
                    value={options.offsetY}
                    onChange={(e) => setOptions({ ...options, offsetY: Number(e.target.value) })}
                    className="w-full accent-accent cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 5. ZOOM MAGNIFIER PREVIEW */}
            {previewDataUrl && (
              <div className="bg-[#182119] border border-[#2d4a1f] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-accent flex items-center gap-1.5 font-mono">
                    <ZoomIn className="w-3.5 h-3.5 text-accent" />
                    우하단 브랜딩 돋보기 뷰 (Zoom)
                  </span>
                  <span className="text-[9px] text-white/40 font-mono">200% Focus</span>
                </div>
                <div className="w-full h-24 rounded-lg overflow-hidden border border-accent/30 bg-[#000] relative">
                  <img 
                    src={previewDataUrl} 
                    alt="돋보기 확대" 
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: 'bottom right',
                      transform: 'scale(1.8)',
                      transformOrigin: 'bottom right'
                    }}
                  />
                </div>
              </div>
            )}

            {/* 6. RESET BUTTON */}
            <button
              type="button"
              onClick={() => setOptions({ ...DEFAULT_OPTIONS })}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg border border-white/10 text-[11px] font-bold transition-all cursor-pointer"
            >
              기본 설정값으로 초기화
            </button>
          </div>
        </div>

        {/* MODAL FOOTER (ACTION BUTTONS) */}
        <div className="px-6 py-4 bg-[#141b14] border-t border-[#2d4a1f]/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-white/70" />
              고해상도 다운로드
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* 공개용 1번 사진으로 R2 저장 */}
            <button
              type="button"
              disabled={isSaving || isProcessing}
              onClick={() => handleSavePublicPhoto(1)}
              className="px-4 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white font-black rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#10b981]/20 disabled:opacity-50"
              title="대회 무대 원본은 보존하고, 선수 공개/다운로드용 1번 사진으로 저장"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSaving ? 'R2 업로드 중...' : '🌐 공개용 1번 (ybbf.org) 저장'}
            </button>

            {/* 공개용 2번 사진으로 R2 저장 */}
            <button
              type="button"
              disabled={isSaving || isProcessing}
              onClick={() => handleSavePublicPhoto(2)}
              className="px-4 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#3b82f6]/20 disabled:opacity-50"
              title="대회 무대 원본은 보존하고, 선수 공개/다운로드용 2번 사진으로 저장"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSaving ? 'R2 업로드 중...' : '🌐 공개용 2번 (ybbf.org) 저장'}
            </button>

            {/* 공개용 사진 풀에 추가 */}
            <button
              type="button"
              disabled={isSaving || isProcessing}
              onClick={() => handleSavePublicPhoto()}
              className="px-4 py-2.5 bg-accent hover:bg-white text-black font-black rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-accent/20 disabled:opacity-50"
              title="공개용 사진 풀에 추가"
            >
              <Upload className="w-4 h-4" />
              {isSaving ? 'R2 업로드 중...' : '➕ 공개용 풀에 등록'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
