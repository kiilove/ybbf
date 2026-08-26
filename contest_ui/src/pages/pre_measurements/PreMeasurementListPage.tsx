import { useEffect, useState } from 'react';
import { usePreMeasurement } from '../../hooks/usePreMeasurement';
import { useContest } from '../../hooks/useContest';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import type { SimpleContest } from '../../services/authService';
import type { Registration } from '../../services/contestService';
import { Play, Trash2, Eye, ShieldAlert, UserCheck, X } from 'lucide-react';
import RegistrationDetailModal from '../registrations/RegistrationDetailModal';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function PreMeasurementListPage() {
  const { staff } = useAuth();
  const { measurements, isLoading: PMloading, fetchMeasurements, deleteMeasurement } = usePreMeasurement();
  const { registrations, setFilter, filters } = useContest();
  const [contests, setContests] = useState<SimpleContest[]>([]);
  
  // Selected registration for details modal
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Video player modal state
  const [activeMedia, setActiveMedia] = useState<{ url: string; type: string } | null>(null);

  // 모바일 화면 감지 상태
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 커스텀 컨펌/알림 모달을 위한 상태
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'success' | 'info';
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Fetch contests list for filter dropdown (if staff has no specific contest bound)
  useEffect(() => {
    async function loadContests() {
      if (!staff?.contestId) {
        const list = await authService.getContestList();
        setContests(list);
        if (list.length > 0 && !filters.contestId) {
          setFilter('contestId', list[0].id);
        }
      }
    }
    loadContests();
  }, [staff]);

  // Initial fetch and set default contestId filter if staff is bound or filter is selected
  useEffect(() => {
    const activeContestId = staff?.contestId || filters.contestId;
    if (activeContestId) {
      fetchMeasurements(activeContestId);
      setFilter('contestId', activeContestId);
    }
  }, [staff, filters.contestId, fetchMeasurements, setFilter]);

  const handleContestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilter('contestId', val);
    fetchMeasurements(val);
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: '사전계측 자료 삭제',
      message: `정말로 ${name} 선수의 사전계측 자료를 삭제하시겠습니까?\n이 작업은 D1 데이터베이스에서 레코드를 제거합니다.`,
      confirmText: '삭제',
      cancelText: '취소',
      type: 'danger',
      onConfirm: async () => {
        // 모달 닫기
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        
        const success = await deleteMeasurement(id);
        if (success) {
          // 완료 성공 알림 모달 노출
          setConfirmConfig({
            isOpen: true,
            title: '삭제 완료',
            message: '사전계측 자료가 성공적으로 삭제되었습니다.',
            confirmText: '확인',
            type: 'success',
            onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
          });
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleOpenDetail = (playerUid: string, playerTel: string) => {
    // Find matching registration in memory
    const found = registrations.find(
      (r) => r.playerUid === playerUid || r.playerTel === playerTel
    );
    if (found) {
      setSelectedReg(found);
      setIsDetailOpen(true);
    } else {
      alert('매칭되는 접수 신청서 내역을 찾을 수 없습니다.');
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return isoStr;
    }
  };

  // Find if a measurement has a matching registration in database
  const getMatchInfo = (playerUid: string, playerTel: string) => {
    return registrations.find(
      (r) => r.playerUid === playerUid || r.playerTel === playerTel
    );
  };

  return (
    <div>
      {/* Contest filter bar (only shown to general staff/admin who can manage multiple contests) */}
      {!staff?.contestId && (
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center', 
          gap: '12px', 
          marginBottom: '24px', 
          backgroundColor: 'var(--color-bg-secondary)', 
          padding: isMobile ? '12px 16px' : '16px 24px', 
          borderRadius: '12px', 
          border: '1px solid var(--color-divider)' 
        }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>조회할 대회 선택:</span>
          <select 
            className="form-select" 
            style={{ width: isMobile ? '100%' : '320px', margin: 0, padding: '8px 12px' }}
            value={filters.contestId}
            onChange={handleContestChange}
            disabled={PMloading}
          >
            <option value="">대회를 선택하세요</option>
            {contests.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      )}

      {PMloading ? (
        <div className="no-data">사전계측 자료를 로드하는 중...</div>
      ) : !filters.contestId ? (
        <div className="no-data" style={{ padding: '60px' }}>
          대회를 먼저 선택해 주세요.
        </div>
      ) : measurements.length === 0 ? (
        <div className="no-data">등록된 사전계측 자료가 없습니다.</div>
      ) : (
        /* Grid of measurements cards */
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: isMobile ? '12px' : '24px' 
        }}>
          {measurements.map((item) => {
            const match = getMatchInfo(item.playerUid, item.playerTel);
            
            return (
              <div 
                key={item.id} 
                style={{ 
                  backgroundColor: 'var(--color-bg-secondary)', 
                  border: '1px solid var(--color-divider)', 
                  borderRadius: isMobile ? '8px' : '12px', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                {/* Media Preview Thumbnail */}
                <div 
                  className="media-preview-container" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveMedia({ url: item.mediaUrl, type: item.mediaType })}
                >
                  {item.mediaType === 'video' ? (
                    <>
                      <video src={item.mediaUrl} preload="metadata" style={{ opacity: 0.8 }} />
                      <div style={{ position: 'absolute', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                        <Play size={20} fill="#ffffff" style={{ marginLeft: '2px' }} />
                      </div>
                    </>
                  ) : (
                    <img src={item.mediaUrl} alt="계측 이미지" />
                  )}
                </div>

                {/* Card Info Body */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {item.playerName}
                      <span style={{ fontSize: '11px', color: 'var(--color-text-light)', fontWeight: 'normal' }}>
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      {item.playerTel}
                    </div>
                  </div>

                  {/* Matching Registration Alert Box */}
                  <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>접수 매칭 상태</span>
                    {match ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-divider)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <UserCheck size={14} style={{ color: 'var(--color-accent)' }} />
                          <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{match.playerGym}</span>
                        </div>
                        {match.isCanceled ? (
                          <span className="badge danger">취소됨</span>
                        ) : match.isPriceCheck ? (
                          <span className="badge success">결제완료</span>
                        ) : (
                          <span className="badge warning">미결제</span>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(239,68,68,0.05)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.1)', color: '#f87171', fontSize: '13px' }}>
                        <ShieldAlert size={14} />
                        미신청 또는 전화번호 불일치
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{ borderTop: '1px solid var(--color-divider)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => handleOpenDetail(item.playerUid, item.playerTel)}
                    disabled={!match}
                  >
                    <Eye size={12} />
                    신청서 연동 조회
                  </button>

                  <button 
                    type="button" 
                    className="btn-logout" 
                    style={{ width: 'auto', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}
                    onClick={() => handleDelete(item.id, item.playerName)}
                  >
                    <Trash2 size={12} />
                    자료 삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video/Media Player Modal Backdrop */}
      {activeMedia && (
        <div className="modal-backdrop" onClick={() => setActiveMedia(null)}>
          <div className="modal-content" style={{ maxWidth: '720px', backgroundColor: '#000000', border: 'none' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ border: 'none', position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
              <button className="btn-icon" style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', color: '#ffffff' }} onClick={() => setActiveMedia(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="media-preview-container" style={{ width: '100%', height: 'auto', border: 'none', borderRadius: 0, aspectRatio: '16/9' }}>
                {activeMedia.type === 'video' ? (
                  <video src={activeMedia.url} controls autoPlay style={{ width: '100%', height: '100%' }} />
                ) : (
                  <img src={activeMedia.url} alt="계측 상세 이미지" style={{ width: '100%', height: '100%' }} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Matching Details Modal */}
      {isDetailOpen && (
        <RegistrationDetailModal 
          registration={selectedReg} 
          onClose={() => setIsDetailOpen(false)} 
        />
      )}

      {/* 커스텀 컨펌/알림 모달 */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={confirmConfig.onCancel}
      />
    </div>
  );
}
