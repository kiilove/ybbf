import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Sparkles, CheckCircle2, Download, 
  RefreshCw, ExternalLink, Sliders, Check
} from 'lucide-react';
import { useContest } from '../../hooks/useContest';
import { contestService } from '../../services/contestService';
import type { Registration } from '../../services/contestService';
import type { 
  BrandingOptions, 
  BrandingPreset 
} from '../../utils/watermarkEngine';
import { 
  processWatermarkBranding, 
  DEFAULT_OPTIONS 
} from '../../utils/watermarkEngine';
import { uploadToR2, deleteFromR2 } from '../../services/uploadToR2Service';
import { processSinglePlayerStagePhotos } from '../../services/batchWatermarkService';
import { getMainSiteUrl } from '../../constants/urls';

export default function PhotoBrandingStudioPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { registrations } = useContest();

  const registrationId = searchParams.get('id') || searchParams.get('registrationId') || '';
  const initialPhotoUrl = searchParams.get('url') || searchParams.get('photoUrl') || '';

  const [currentRegistration, setCurrentRegistration] = useState<Registration | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<1 | 2>(1);
  const [options, setOptions] = useState<BrandingOptions>({ ...DEFAULT_OPTIONS });
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // 1. 선수 데이터 로드
  useEffect(() => {
    async function loadTarget() {
      if (!registrationId) return;
      let found = registrations.find(r => r.id === registrationId);
      if (!found) {
        try {
          const list = await contestService.fetchRegistrationsFromFirestore();
          found = list.find(r => r.id === registrationId);
        } catch (e) {
          console.error('선수 로드 실패:', e);
        }
      }
      if (found) {
        setCurrentRegistration(found);
        const s2 = found.stagePhoto2 || found.selectedPhotoUrls?.[1];
        if (initialPhotoUrl && s2 === initialPhotoUrl) {
          setSelectedSlot(2);
        }
      }
    }
    loadTarget();
  }, [registrationId, registrations, initialPhotoUrl]);

  // 2. 현재 선택된 슬롯의 원본 사진 URL
  const currentSlotPhotoUrl = useMemo(() => {
    if (!currentRegistration) return initialPhotoUrl || '';
    if (selectedSlot === 1) {
      return currentRegistration.stagePhoto1 || currentRegistration.selectedPhotoUrls?.[0] || initialPhotoUrl || '';
    } else {
      return currentRegistration.stagePhoto2 || currentRegistration.selectedPhotoUrls?.[1] || initialPhotoUrl || '';
    }
  }, [currentRegistration, selectedSlot, initialPhotoUrl]);

  // 3. 실시간 워터마크 마스킹 렌더링
  useEffect(() => {
    if (!currentSlotPhotoUrl) return;

    let isMounted = true;
    const render = async () => {
      setIsProcessing(true);
      try {
        const result = await processWatermarkBranding(currentSlotPhotoUrl, options);
        if (isMounted) {
          setPreviewDataUrl(result.dataUrl);
          setProcessedFile(result.file);
        }
      } catch (err) {
        console.error('워터마크 브랜딩 처리 실패:', err);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };

    const timer = setTimeout(render, 50);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentSlotPhotoUrl, options]);

  // 4. 공개용 사진 R2 저장 및 발행
  const handleSavePublishedPhoto = async () => {
    if (!processedFile || !currentRegistration) return;

    setIsSaving(true);
    try {
      const { file } = await processWatermarkBranding(currentSlotPhotoUrl, options);
      const playerIdentifier = currentRegistration.playerUid || currentRegistration.playerTel || currentRegistration.id;
      const folderKey = `contest_player_${playerIdentifier}_public_s${selectedSlot}`;
      
      // 🗑️ 기존 해당 슬롯에 이미 가공본이 있었다면 R2 버킷에서 먼저 삭제
      const oldSlotPhoto = selectedSlot === 1 ? currentRegistration.publicStagePhoto1 : currentRegistration.publicStagePhoto2;
      if (oldSlotPhoto && oldSlotPhoto !== currentSlotPhotoUrl) {
        await deleteFromR2(oldSlotPhoto);
      }

      const uploadedR2Url = await uploadToR2(file, folderKey, true);
      if (!uploadedR2Url) {
        throw new Error('R2 서버에서 반환된 이미지 URL이 없습니다.');
      }

      const currentPublicPhotos: string[] = [];
      const sourcePublic = currentRegistration.publicPhotoUrls || [];
      sourcePublic.forEach(url => {
        if (url && !currentPublicPhotos.includes(url)) currentPublicPhotos.push(url);
      });
      if (!currentPublicPhotos.includes(uploadedR2Url)) {
        currentPublicPhotos.push(uploadedR2Url);
      }

      let pubSlot1 = currentRegistration.publicStagePhoto1 || '';
      let pubSlot2 = currentRegistration.publicStagePhoto2 || '';

      if (selectedSlot === 1) {
        pubSlot1 = uploadedR2Url;
      } else {
        pubSlot2 = uploadedR2Url;
      }

      const updatedReg: Registration = {
        ...currentRegistration,
        publicStagePhoto1: pubSlot1,
        publicStagePhoto2: pubSlot2,
        publicPhotoUrls: currentPublicPhotos,
      };

      await contestService.saveRegistration(updatedReg);

      setCurrentRegistration(updatedReg);
      setSaveSuccessMsg(`🎉 무대 ${selectedSlot}번 사진이 'ybbf.org 공개용'으로 성공적으로 발행되었습니다!`);
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } catch (err: any) {
      alert('공개용 사진 저장 오류: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setIsSaving(false);
    }
  };

  // 5. 로컬 다운로드
  const handleDownload = () => {
    if (!previewDataUrl) return;
    const a = document.createElement('a');
    a.href = previewDataUrl;
    a.download = `ybbf_${currentRegistration?.playerName || 'athlete'}_stage${selectedSlot}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const slot1Url = currentRegistration?.stagePhoto1 || currentRegistration?.selectedPhotoUrls?.[0] || '';
  const slot2Url = currentRegistration?.stagePhoto2 || currentRegistration?.selectedPhotoUrls?.[1] || '';
  const isSlot1Published = Boolean(currentRegistration?.publicStagePhoto1);
  const isSlot2Published = Boolean(currentRegistration?.publicStagePhoto2);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#080c09',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden'
    }}>
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. 상단 글로벌 헤더 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header style={{
        height: '64px',
        padding: '0 24px',
        backgroundColor: '#111812',
        borderBottom: '1px solid rgba(45, 74, 31, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={() => navigate('/photos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#e5e7eb',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={16} />
            선수 목록으로 돌아가기
          </button>

          <div style={{ height: '24px', width: '1px', backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '17px', fontWeight: 900, color: '#ffffff' }}>
              {currentRegistration?.playerName || '선수'} 선수
            </span>
            <span style={{
              fontSize: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#d1d5db',
              padding: '3px 8px',
              borderRadius: '6px',
              fontWeight: 600
            }}>
              {currentRegistration?.playerGender === 'm' ? '남성' : '여성'} • {currentRegistration?.playerGym || '소속 없음'}
            </span>
            <span style={{
              fontSize: '11px',
              backgroundColor: 'rgba(210, 255, 0, 0.15)',
              color: '#d2ff00',
              border: '1px solid rgba(210, 255, 0, 0.4)',
              padding: '3px 10px',
              borderRadius: '20px',
              fontWeight: 800
            }}>
              공식 워터마크 브랜딩 스튜디오
            </span>
          </div>
        </div>

        {/* Header Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentRegistration && (
            <a
              href={`${getMainSiteUrl()}/showcase/${encodeURIComponent(currentRegistration.id || currentRegistration.playerUid)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: 'rgba(210, 255, 0, 0.15)',
                border: '1px solid rgba(210, 255, 0, 0.4)',
                color: '#d2ff00',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <ExternalLink size={14} />
              공개 쇼케이스 보기
            </a>
          )}
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2. 메인 워크스페이스 (STEP 1 + STEP 2 + STEP 3) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 20px',
        gap: '14px',
        overflow: 'hidden'
      }}>
        
        {/* 🌟 STEP 1: 작업 대상 무대 사진 선택 */}
        <div style={{
          backgroundColor: '#121913',
          border: '1px solid rgba(45, 74, 31, 0.8)',
          borderRadius: '14px',
          padding: '14px 18px',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#d2ff00',
                color: '#000000',
                fontWeight: 900,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>1</span>
              <h2 style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                STEP 1. 작업할 무대 사진 선택 <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>(대회용으로 지정된 2개 컷 중 선택)</span>
              </h2>
            </div>
            <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>
              선택한 무대 사진이 아래 캔버스에 즉시 로드됩니다.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* 무대 1번 카드 */}
            <div
              onClick={() => setSelectedSlot(1)}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                border: selectedSlot === 1 ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: selectedSlot === 1 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 0, 0, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.2s ease',
                boxShadow: selectedSlot === 1 ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'none'
              }}
            >
              <div style={{
                width: '56px',
                height: '70px',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#000000',
                flexShrink: 0,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative'
              }}>
                {slot1Url ? (
                  <img src={slot1Url} alt="무대 1번" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#6b7280' }}>미등록</div>
                )}
                {selectedSlot === 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '18px',
                    height: '18px',
                    backgroundColor: '#10b981',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000000'
                  }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    🏆 무대 1번 (메인 전신 컷)
                  </span>
                  {selectedSlot === 1 && (
                    <span style={{ fontSize: '11px', color: '#d2ff00', fontWeight: 900 }}>👉 편집 중</span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#d1d5db', fontWeight: 600, marginBottom: '4px' }}>
                  {slot1Url ? '무대 송출용 원본 사진 등록됨' : '사진 미등록'}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                  {isSlot1Published ? (
                    <span style={{ color: '#d2ff00', fontWeight: 800 }}>✅ ybbf.org 공개용 발행 완료</span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>⏳ 공개용 미발행 (워터마크 가공 필요)</span>
                  )}
                </div>
              </div>
            </div>

            {/* 무대 2번 카드 */}
            <div
              onClick={() => setSelectedSlot(2)}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                border: selectedSlot === 2 ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: selectedSlot === 2 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.2s ease',
                boxShadow: selectedSlot === 2 ? '0 0 16px rgba(59, 130, 246, 0.25)' : 'none'
              }}
            >
              <div style={{
                width: '56px',
                height: '70px',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#000000',
                flexShrink: 0,
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative'
              }}>
                {slot2Url ? (
                  <img src={slot2Url} alt="무대 2번" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#6b7280' }}>미등록</div>
                )}
                {selectedSlot === 2 && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '18px',
                    height: '18px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color: '#60a5fa',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    🥈 무대 2번 (액션 포즈 컷)
                  </span>
                  {selectedSlot === 2 && (
                    <span style={{ fontSize: '11px', color: '#d2ff00', fontWeight: 900 }}>👉 편집 중</span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#d1d5db', fontWeight: 600, marginBottom: '4px' }}>
                  {slot2Url ? '무대 송출용 원본 사진 등록됨' : '사진 미등록'}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                  {isSlot2Published ? (
                    <span style={{ color: '#d2ff00', fontWeight: 800 }}>✅ ybbf.org 공개용 발행 완료</span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>⏳ 공개용 미발행 (워터마크 가공 필요)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🌟 STEP 2 & STEP 3: 비교 작업대 + 스타일 툴박스 */}
        <div style={{
          flex: 1,
          display: 'flex',
          gap: '14px',
          overflow: 'hidden'
        }}>
          
          {/* STEP 2: 실시간 나란한 비교 뷰어 */}
          <div style={{
            flex: 1,
            backgroundColor: '#0f1610',
            border: '1px solid rgba(45, 74, 31, 0.8)',
            borderRadius: '14px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#d2ff00',
                  color: '#000000',
                  fontWeight: 900,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>2</span>
                <h2 style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                  STEP 2. 실시간 가공 결과 확인 <span style={{ fontSize: '12px', color: '#d2ff00', fontFamily: 'monospace' }}>(우측 하단 워터마크 자동 마스킹)</span>
                </h2>
              </div>

              {isProcessing && (
                <span style={{ fontSize: '12px', color: '#d2ff00', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace' }}>
                  <RefreshCw size={14} className="animate-spin" /> 렌더링 중...
                </span>
              )}
            </div>

            {/* Side-by-Side Comparison Container */}
            <div style={{
              flex: 1,
              width: '100%',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '12px',
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              
              {/* 좌측: 원본 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexShrink: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#e5e7eb', fontFamily: 'monospace' }}>
                    1. 원본 (Gemini AI 워터마크 노출)
                  </span>
                </div>
                <div style={{
                  position: 'relative',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  backgroundColor: '#000000',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  maxHeight: '44vh'
                }}>
                  {currentSlotPhotoUrl ? (
                    <img src={currentSlotPhotoUrl} alt="원본" style={{ maxHeight: '42vh', maxWidth: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>사진이 없습니다.</span>
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.85)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.6)'
                  }}>
                    워터마크 위치
                  </div>
                </div>
              </div>

              {/* 우측: ybbf.org 브랜딩 가공본 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexShrink: 0 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d2ff00' }} />
                  <span style={{ fontSize: '12px', fontWeight: 900, color: '#d2ff00', fontFamily: 'monospace' }}>
                    2. 완성본 (ybbf.org 공식 뱃지로 마스킹)
                  </span>
                </div>
                <div style={{
                  position: 'relative',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '2px solid rgba(210, 255, 0, 0.8)',
                  backgroundColor: '#000000',
                  boxShadow: '0 0 20px rgba(210, 255, 0, 0.2)',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  maxHeight: '44vh'
                }}>
                  {previewDataUrl ? (
                    <img src={previewDataUrl} alt="가공본" style={{ maxHeight: '42vh', maxWidth: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '12px' }}>
                      <RefreshCw size={20} className="animate-spin" style={{ color: '#d2ff00' }} />
                      <span>이미지 가공 중...</span>
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    backgroundColor: '#d2ff00',
                    color: '#000000',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '3px 8px',
                    borderRadius: '5px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Sparkles size={12} /> ybbf.org 브랜딩
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: 브랜딩 스타일 & 세부 조절 툴박스 */}
          <div style={{
            width: '360px',
            backgroundColor: '#121913',
            border: '1px solid rgba(45, 74, 31, 0.8)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
            flexShrink: 0
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#d2ff00',
                  color: '#000000',
                  fontWeight: 900,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>3</span>
                <h2 style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                  STEP 3. 디자인 스타일 선택
                </h2>
              </div>

              {/* 프리셋 선택 4종 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                {[
                  { id: 'neon_badge', label: '🟢 네온 뱃지', desc: '라임 시그니처 (추천)' },
                  { id: 'official_stamp', label: '🏷️ 공식 2단 스탬프', desc: '용인시보디빌딩협회' },
                  { id: 'glass_pill', label: '⚪ 글래스 캡슐', desc: '반투명 미니멀' },
                  { id: 'subtle_text', label: '📝 서브틀 텍스트', desc: '그림자 워터마크' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setOptions({ ...options, preset: p.id as BrandingPreset })}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: options.preset === p.id ? '2px solid #d2ff00' : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: options.preset === p.id ? 'rgba(210, 255, 0, 0.15)' : 'rgba(0, 0, 0, 0.4)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{p.label}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{p.desc}</div>
                  </button>
                ))}
              </div>

              {/* 텍스트 입력 */}
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '10px 12px',
                marginBottom: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {options.preset === 'official_stamp' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#d2ff00', marginBottom: '4px', textTransform: 'uppercase' }}>
                      상단 협회 명칭
                    </label>
                    <input 
                      type="text" 
                      value={options.subText || '용인시보디빌딩협회'} 
                      onChange={(e) => setOptions({ ...options, subText: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        border: '1px solid rgba(210, 255, 0, 0.3)',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      placeholder="용인시보디빌딩협회"
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase' }}>
                    메인 브랜딩 문구
                  </label>
                  <input 
                    type="text" 
                    value={options.text} 
                    onChange={(e) => setOptions({ ...options, text: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '12px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="ybbf.org"
                  />
                </div>
              </div>

              {/* 슬라이더 간편 조절 */}
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#d2ff00', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={14} />
                  미세 조절 (필요 시 조절)
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>
                    <span>워터마크 가림 강도:</span>
                    <span style={{ color: '#d2ff00', fontWeight: 800 }}>{Math.round(options.maskIntensity! * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="1.0" 
                    step="0.02" 
                    value={options.maskIntensity} 
                    onChange={(e) => setOptions({ ...options, maskIntensity: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#d2ff00', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>
                    <span>뱃지 크기:</span>
                    <span style={{ color: '#ffffff', fontWeight: 800 }}>{options.fontSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="14" 
                    max="32" 
                    value={options.fontSize} 
                    onChange={(e) => setOptions({ ...options, fontSize: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#d2ff00', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* 초기화 버튼 */}
            <button
              type="button"
              onClick={() => setOptions({ ...DEFAULT_OPTIONS })}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: '#9ca3af',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              기본 설정값으로 리셋
            </button>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3. 하단 메인 발행 액션 바 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer style={{
        height: '76px',
        padding: '0 28px',
        backgroundColor: '#111812',
        borderTop: '2px solid rgba(45, 74, 31, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 20,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleDownload}
            style={{
              padding: '10px 18px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Download size={16} color="#9ca3af" />
            PC에 이미지 다운로드
          </button>

          {saveSuccessMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.5)',
              color: '#34d399',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 900
            }}>
              <CheckCircle2 size={16} />
              <span>{saveSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* 🌟 메인 발행 액션 버튼 그룹 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* 1번 & 2번 무대 사진 일괄 자동 발행 버튼 */}
          {(slot1Url || slot2Url) && (
            <button
              type="button"
              disabled={isSaving || isProcessing}
              onClick={async () => {
                if (!currentRegistration) return;
                setIsSaving(true);
                try {
                  const res = await processSinglePlayerStagePhotos(currentRegistration, options);
                  setCurrentRegistration(res.updatedRegistration);
                  setSaveSuccessMsg('🎉 무대 1번과 2번 사진이 모두 일괄 가공 & 발행 완료되었습니다!');
                  setTimeout(() => setSaveSuccessMsg(''), 5000);
                } catch (err: any) {
                  alert('일괄 발행 오류: ' + (err.message || '알 수 없는 오류'));
                } finally {
                  setIsSaving(false);
                }
              }}
              style={{
                padding: '14px 24px',
                borderRadius: '14px',
                fontWeight: 900,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                border: '1px solid rgba(210, 255, 0, 0.4)',
                backgroundColor: 'rgba(210, 255, 0, 0.15)',
                color: '#d2ff00',
                boxShadow: '0 4px 14px rgba(210, 255, 0, 0.2)',
                transition: 'all 0.2s ease',
                opacity: (isSaving || isProcessing) ? 0.5 : 1
              }}
              title="이 선수의 무대 1번과 2번 사진을 모두 한 번에 자동 가공하여 발행합니다"
            >
              <Sparkles size={16} />
              <span>⚡️ 1번 & 2번 무대 사진 일괄 자동 발행</span>
            </button>
          )}

          {/* 현재 선택된 슬롯 저장 버튼 */}
          <button
            type="button"
            disabled={isSaving || isProcessing || !currentSlotPhotoUrl}
            onClick={handleSavePublishedPhoto}
            style={{
              padding: '14px 28px',
              borderRadius: '14px',
              fontWeight: 900,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              border: 'none',
              backgroundColor: selectedSlot === 1 ? '#10b981' : '#3b82f6',
              color: '#ffffff',
              boxShadow: selectedSlot === 1 ? '0 4px 18px rgba(16, 185, 129, 0.4)' : '0 4px 18px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.2s ease',
              opacity: (isSaving || isProcessing || !currentSlotPhotoUrl) ? 0.5 : 1
            }}
          >
            <CheckCircle2 size={18} />
            <span>
              {isSaving 
                ? 'R2 서버에 업로드 및 발행 중...' 
                : `[무대 ${selectedSlot}번 사진] ybbf.org 공개용으로 발행`
              }
            </span>
          </button>
        </div>
      </footer>

    </div>
  );
}
