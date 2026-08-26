import React, { useEffect, useState } from 'react';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { adminService } from '../services/adminService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Save, 
  Upload, 
  Loader,
  Clock,
  PlayCircle,
  FileCheck2,
  FolderLock,
  Database,
  Filter,
  RefreshCw
} from 'lucide-react';
import type { SystemSettings } from '../types/auth';

const phaseDetails = [
  {
    value: 'UPCOMING',
    label: '대회 준비 / 예고 (Upcoming)',
    icon: Clock,
    color: '#3b82f6',
    description: '대회 요강 및 일정을 노출하며, 접수 시작 전 이메일 알림 예약을 받습니다.'
  },
  {
    value: 'REGISTRATION',
    label: '참가 접수 개시 (Registration)',
    icon: FileCheck2,
    color: '#84cc16',
    description: '대회 참가 신청 접수 폼이 활성화되어 선수들이 온라인으로 신청 및 R2 사진 업로드를 진행할 수 있습니다.'
  },
  {
    value: 'CLOSED',
    label: '접수 마감 (Closed)',
    icon: FolderLock,
    color: '#ef4444',
    description: '대회 참가 접수가 마감되어 신청 폼 접근이 차단되고 마감 안내문이 표시됩니다.'
  },
  {
    value: 'LIVE',
    label: '대회 진행 및 중계 (Live)',
    icon: PlayCircle,
    color: '#a855f7',
    description: '대회 당일 라이브 방송 송출 및 실시간 투표, 응원 댓글 창이 활성화됩니다.'
  },
  {
    value: 'RESULT',
    label: '대회 종료 / 결과 발표 (Result)',
    icon: Trophy,
    color: '#eab308',
    description: '대회가 종료되고 공식 그랑프리 결과 및 시상 내역 아카이브가 노출됩니다.'
  }
];

export default function SystemSettingsPage() {
  const { 
    settings, 
    isLoading, 
    isUpdating, 
    error, 
    successMsg, 
    fetchSettings, 
    saveSettings 
  } = useSystemSettings();

  const [formSettings, setFormSettings] = useState<SystemSettings | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Firestore 대회 공고 목록 상태
  const [notices, setNotices] = useState<any[]>([]);
  const [isNoticesLoading, setIsNoticesLoading] = useState(false);
  
  // "접수중" 상태 대회만 필터링하는 조건 토글 (기본값: true)
  const [filterActiveOnly, setFilterActiveOnly] = useState(true);

  // Firestore 데이터 동기화 완료 알림 상태
  const [syncNoticeMsg, setSyncNoticeMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setFormSettings({ ...settings });
    }
  }, [settings]);

  // Firestore에서 대회 공고 리스트 조회
  useEffect(() => {
    async function loadFirestoreNotices() {
      setIsNoticesLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'contest_notice'));
        const list = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotices(list);
      } catch (err) {
        console.error('Firestore 대회 공고 목록 로드 실패:', err);
      } finally {
        setIsNoticesLoading(false);
      }
    }
    loadFirestoreNotices();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!formSettings) return;
    const { name, value } = e.target;
    
    // 수치형 데이터 가공 처리
    if (name === 'competitionPriceBasic' || name === 'competitionPriceExtra') {
      const numValue = value === '' ? 0 : parseInt(value.replace(/[^0-9]/g, ''), 10);
      setFormSettings(prev => prev ? { ...prev, [name]: numValue } : null);
    } else {
      setFormSettings(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handlePhaseChange = (phase: string) => {
    if (!formSettings) return;
    setFormSettings(prev => prev ? { ...prev, competitionPhase: phase } : null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formSettings) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 선택할 수 있습니다.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const url = await adminService.uploadImage(file, 'competition_poster');
      setFormSettings(prev => prev ? { ...prev, competitionPosterUrl: url } : null);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '이미지 업로드 중 오류가 발생했습니다.';
      setUploadError(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSettings) return;
    await saveSettings(formSettings);
  };

  // 💡 대회 상태 필터링 처리 로직
  const getFilteredNotices = () => {
    if (!filterActiveOnly) return notices;
    return notices.filter(notice => {
      const status = notice.contestStatus || '';
      return status === '접수중' || status === '접수' || status === 'REGISTRATION' || status === 'registration';
    });
  };

  const filteredNotices = getFilteredNotices();

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--color-text-muted)' }}>
        <Loader className="animate-spin" size={32} style={{ margin: '0 auto 16px', display: 'block' }} />
        <span>대회 및 시스템 설정을 조회하는 중입니다...</span>
      </div>
    );
  }

  if (!formSettings) {
    return (
      <div className="alert-message alert-error">
        <AlertTriangle size={16} />
        <span>대회 설정 데이터를 로드하지 못했습니다. 새로고침을 해주십시오.</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">대회 접수 및 시스템 설정</h1>
          <p className="page-subtitle">공식 대회의 단계(준비중/접수중/라이브 등)를 관리하고, 참가비 및 안내문 정보를 일괄 구성합니다.</p>
        </div>
      </div>

      {successMsg && (
        <div className="alert-message alert-success" style={{ marginBottom: '24px' }}>
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert-message alert-error" style={{ marginBottom: '24px' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* 1. 대회 운영 단계 제어 패널 */}
        <div className="panel" style={{ marginBottom: '32px' }}>
          <h3 className="form-section-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--color-accent-dark)' }} />
            <span>대회 진행 단계 제어 (Phase Control)</span>
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {phaseDetails.map(phase => {
              const isSelected = formSettings.competitionPhase === phase.value;
              const IconComponent = phase.icon;
              return (
                <div 
                  key={phase.value}
                  onClick={() => handlePhaseChange(phase.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '16px',
                    borderRadius: 'var(--border-radius-sm)',
                    border: isSelected ? `2px solid ${phase.color}` : '1px solid var(--color-divider)',
                    backgroundColor: isSelected ? `${phase.color}08` : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? phase.color : '#f1f5f9',
                    color: isSelected ? '#ffffff' : 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconComponent size={20} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--color-text-primary)' }}>
                        {phase.label}
                      </span>
                      {isSelected && (
                        <span style={{
                          backgroundColor: phase.color,
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          textTransform: 'uppercase'
                        }}>
                          Active
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: '1.5' }}>
                      {phase.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', height: '40px' }}>
                    <input 
                      type="radio" 
                      name="competitionPhase"
                      checked={isSelected}
                      onChange={() => {}} // parent div onClick handles state
                      style={{ 
                        width: '18px', 
                        height: '18px', 
                        accentColor: phase.color,
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. 대회 접수 연동 설정 (Firestore) */}
        <div className="panel" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-divider)', paddingBottom: '12px' }}>
            <h3 className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Database size={18} style={{ color: 'var(--color-accent-dark)' }} />
              <span>접수 대상 대회 연동 및 D1 동기화</span>
            </h3>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--color-text-muted)', fontWeight: '600' }}>
              <Filter size={14} style={{ color: filterActiveOnly ? 'var(--color-accent-dark)' : 'var(--color-text-light)' }} />
              <input 
                type="checkbox" 
                checked={filterActiveOnly} 
                onChange={(e) => setFilterActiveOnly(e.target.checked)} 
                style={{ width: '14px', height: '14px', cursor: 'pointer' }}
              />
              <span>접수 진행중인 공고만 표시 (contestStatus: 접수중)</span>
            </label>
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
              연동할 대회 공고 선택 (선택 시 D1 로컬 복사 동기화 진행)
            </label>
            {isNoticesLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                <Loader className="animate-spin" size={14} />
                <span>Firestore에서 대회 리스트를 불러오는 중...</span>
              </div>
            ) : (
              <select
                name="activeNoticeId"
                className="form-control"
                value={formSettings.activeNoticeId || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const selected = notices.find(n => n.id === selectedId);
                  
                  if (!selectedId) {
                    setFormSettings(prev => prev ? { ...prev, activeNoticeId: '', activeContestId: '' } : null);
                    setSyncNoticeMsg(null);
                    return;
                  }

                  // 💡 [핵심 연동]: 선택된 Firestore 공고 데이터를 D1 로컬 설정 필드에 복사/대입
                  setFormSettings(prev => {
                    if (!prev) return null;
                    return {
                      ...prev,
                      activeNoticeId: selectedId,
                      activeContestId: selected.refContestId || '',
                      
                      // Firestore 필드 ➡️ D1 설정 필드 1:1 매핑 복사
                      competitionTitle: selected.contestTitle || prev.competitionTitle,
                      competitionDate: selected.contestDate || prev.competitionDate,
                      // Firestore의 contestLocation 또는 contestVenue를 개최지로 바인딩
                      competitionVenue: selected.contestLocation || selected.contestVenue || prev.competitionVenue,
                      competitionBankName: selected.contestBankName || prev.competitionBankName,
                      competitionAccountNumber: selected.contestAccountNumber || prev.competitionAccountNumber,
                      competitionAccountOwner: selected.contestAccountOwner || prev.competitionAccountOwner,
                      competitionPriceBasic: Number(selected.contestPriceBasic) || prev.competitionPriceBasic,
                      competitionPriceExtra: Number(selected.contestPriceExtra) || prev.competitionPriceExtra,
                      competitionPosterUrl: selected.contestPoster || prev.competitionPosterUrl
                    };
                  });

                  setSyncNoticeMsg(`'${selected.contestTitle}' 공고의 상세 정보(참가비, 계좌번호 등)가 설정에 자동 복사되었습니다. 저장 시 D1에 동기화 완료됩니다.`);
                  setTimeout(() => setSyncNoticeMsg(null), 7000);
                }}
                required
              >
                <option value="">대회를 선택하세요</option>
                {filteredNotices.map(notice => (
                  <option key={notice.id} value={notice.id}>
                    {notice.contestTitle} ({notice.contestDate || '날짜 미정'}) - [{notice.contestStatus || '상태 없음'}] - ID: {notice.id}
                  </option>
                ))}
              </select>
            )}
            
            {/* 필터링 결과가 비어있을 때 알림 */}
            {!isNoticesLoading && filteredNotices.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-error)', marginTop: '8px', backgroundColor: 'var(--color-error-light)', padding: '6px 12px', borderRadius: '4px' }}>
                <AlertTriangle size={14} />
                <span>현재 '접수중' 상태인 대회 공고가 없습니다. 전체 공고를 보시려면 우측 상단 필터링 체크를 해제해 주십시오.</span>
              </div>
            )}

            {/* Firestore 데이터 복사 알림 */}
            {syncNoticeMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-success)', marginTop: '8px', backgroundColor: 'var(--color-success-light)', padding: '8px 12px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--color-success)' }} />
                <span>{syncNoticeMsg}</span>
              </div>
            )}

            <span className="form-helper" style={{ marginTop: '8px', display: 'block', color: 'var(--color-text-muted)' }}>
              * <strong>[성능 최적화]</strong> 대회 선택 시 Firestore 상세 데이터를 읽어와 하단 입력창에 자동으로 대입합니다. 저장하면 D1에 일괄 적재되므로 선수들이 접수할 때마다 매번 Firestore를 추가 쿼리하지 않아 자원이 낭비되지 않습니다.
            </span>
          </div>
          
          {formSettings.activeNoticeId && (
            <div style={{ 
              marginTop: '16px', 
              backgroundColor: '#f8fafc', 
              padding: '14px 16px', 
              borderRadius: '8px', 
              fontSize: '13px', 
              border: '1px solid var(--color-divider)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div>
                <strong style={{ color: 'var(--color-text-primary)' }}>선택된 Notice ID (대회 공고 식별자):</strong> 
                <code style={{ marginLeft: '8px', color: 'var(--color-accent-dark)', fontWeight: 'bold', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                  {formSettings.activeNoticeId}
                </code>
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-primary)' }}>참조하는 Contest ID (대회 메타데이터):</strong> 
                <code style={{ marginLeft: '8px', color: 'var(--color-accent-dark)', fontWeight: 'bold', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                  {formSettings.activeContestId || '없음'}
                </code>
              </div>
            </div>
          )}
        </div>

        <div className="form-grid">
          {/* 3. 대회 기본 안내 설정 */}
          <div className="panel col-6" style={{ height: 'fit-content' }}>
            <h3 className="form-section-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} style={{ color: 'var(--color-accent-dark)' }} />
              <span>대회 기본 안내 설정</span>
            </h3>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">대회 공식 타이틀 (Title)</label>
              <input
                type="text"
                name="competitionTitle"
                className="form-control"
                value={formSettings.competitionTitle || ''}
                onChange={handleChange}
                placeholder="예: 2026 YBBF CHAMPIONSHIP"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">대회 개최 일시 (Date)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="competitionDate"
                  className="form-control"
                  value={formSettings.competitionDate || ''}
                  onChange={handleChange}
                  placeholder="예: 2026. 10. 15 (토) 13:00"
                  required
                />
                <Calendar size={16} style={{ position: 'absolute', right: '12px', top: '13px', color: 'var(--color-text-light)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">대회 개최 장소 (Venue)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="competitionVenue"
                  className="form-control"
                  value={formSettings.competitionVenue || ''}
                  onChange={handleChange}
                  placeholder="예: 용인시 실내체육관 특설무대"
                  required
                />
                <MapPin size={16} style={{ position: 'absolute', right: '12px', top: '13px', color: 'var(--color-text-light)' }} />
              </div>
            </div>
          </div>

          {/* 4. 참가비 및 입금 계좌 정보 */}
          <div className="panel col-6" style={{ height: 'fit-content' }}>
            <h3 className="form-section-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} style={{ color: 'var(--color-accent-dark)' }} />
              <span>참가비 및 입금 계좌 설정</span>
            </h3>

            <div className="form-grid" style={{ gap: '16px', marginBottom: '16px' }}>
              <div className="form-group col-6">
                <label className="form-label">기본 참가비 (원)</label>
                <input
                  type="text"
                  name="competitionPriceBasic"
                  className="form-control"
                  value={formSettings.competitionPriceBasic?.toLocaleString() || '0'}
                  onChange={handleChange}
                  style={{ textAlign: 'right', fontWeight: 'bold' }}
                  required
                />
              </div>

              <div className="form-group col-6">
                <label className="form-label">중복 출전비 (원)</label>
                <input
                  type="text"
                  name="competitionPriceExtra"
                  className="form-control"
                  value={formSettings.competitionPriceExtra?.toLocaleString() || '0'}
                  onChange={handleChange}
                  style={{ textAlign: 'right', fontWeight: 'bold' }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">입금 은행명</label>
              <input
                type="text"
                name="competitionBankName"
                className="form-control"
                value={formSettings.competitionBankName || ''}
                onChange={handleChange}
                placeholder="예: 우리은행, 국민은행"
                required
              />
            </div>

            <div className="form-grid" style={{ gap: '16px' }}>
              <div className="form-group col-7">
                <label className="form-label">입금 계좌번호</label>
                <input
                  type="text"
                  name="competitionAccountNumber"
                  className="form-control"
                  value={formSettings.competitionAccountNumber || ''}
                  onChange={handleChange}
                  placeholder="계좌번호 입력 (하이픈 포함)"
                  required
                />
              </div>

              <div className="form-group col-5">
                <label className="form-label">예금주명</label>
                <input
                  type="text"
                  name="competitionAccountOwner"
                  className="form-control"
                  value={formSettings.competitionAccountOwner || ''}
                  onChange={handleChange}
                  placeholder="예금주 성명"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* 5. 대회 대표 포스터 및 사진 설정 */}
        <div className="panel" style={{ marginTop: '24px' }}>
          <h3 className="form-section-title" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} style={{ color: 'var(--color-accent-dark)' }} />
            <span>대회 홍보 대표 포스터 이미지 (R2 연동)</span>
          </h3>

          <div className="upload-wrapper" style={{ margin: '12px 0' }}>
            {formSettings.competitionPosterUrl ? (
              <img 
                src={formSettings.competitionPosterUrl} 
                alt="대회 포스터 프리뷰" 
                className="upload-preview" 
                style={{ maxHeight: '300px', width: 'auto', objectFit: 'contain', borderRadius: '8px' }} 
              />
            ) : (
              <div className="upload-placeholder" style={{ height: '200px', width: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                포스터 이미지 없음
              </div>
            )}
            
            <div className="upload-actions">
              <label className="upload-btn-label">
                <Upload size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                새 포스터 파일 업로드
                <input 
                  type="file" 
                  className="upload-file-input" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  disabled={isUploading || isUpdating}
                />
              </label>
              <span className="form-helper">Cloudflare R2 버킷에 저장되며 대회 예고/접수 페이지 대표 이미지로 연동됩니다.</span>
            </div>
            
            {isUploading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-accent-dark)', marginTop: '8px' }}>
                <Loader className="animate-spin" size={16} />
                <span>R2 스토리지 업로드 중...</span>
              </div>
            )}
          </div>
          {uploadError && <span className="form-helper" style={{ color: 'var(--color-error)' }}>{uploadError}</span>}
          
          <input
            type="text"
            name="competitionPosterUrl"
            className="form-control"
            value={formSettings.competitionPosterUrl || ''}
            onChange={handleChange}
            placeholder="https://example.com/poster.jpg"
            style={{ marginTop: '16px' }}
          />
        </div>

        {/* 6. 제출 및 저장 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', borderTop: '1px solid var(--color-divider)', paddingTop: '24px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isUpdating || isUploading}
            style={{ padding: '12px 28px' }}
          >
            <Save size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            <span>{isUpdating ? '설정 저장 중...' : '대회 및 시스템 설정 저장'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
