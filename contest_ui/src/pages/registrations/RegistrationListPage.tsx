import { useEffect, useState } from 'react';
import { useContest } from '../../hooks/useContest';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import type { SimpleContest } from '../../services/authService';
import type { Registration } from '../../services/contestService';
import { 
  Search, FileSpreadsheet, Plus, Eye, Edit2, Trash2, 
  CheckCircle2, ShieldAlert, RotateCcw, RefreshCw 
} from 'lucide-react';
import RegistrationDetailModal from './RegistrationDetailModal';
import RegistrationFormModal from './RegistrationFormModal';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function RegistrationListPage() {
  const { staff } = useAuth();
  const { 
    registrations, isLoading, filters, fetchList, setFilter, resetFilters,
    togglePaymentStatus, toggleCancelStatus, saveRegistration, syncFromFirestore 
  } = useContest();

  const [contests, setContests] = useState<SimpleContest[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncFirestore = async () => {
    if (!confirm('Firebase 기준(Source of Truth)으로 서버 DB 접수/입금 데이터를 동기화하시겠습니까?')) {
      return;
    }
    setIsSyncing(true);
    try {
      const result = await syncFromFirestore(filters.contestId);
      alert(result.message || 'Firebase 데이터 동기화가 완료되었습니다.');
    } catch (err: any) {
      alert('동기화 오류: ' + (err?.message || '동기화 실패'));
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Modals state
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<Registration | null>(null); // null means new

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

  // 모바일 화면 감지 상태
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    if (staff?.contestId) {
      setFilter('contestId', staff.contestId);
    } else if (filters.contestId) {
      fetchList();
    }
  }, [staff, filters.contestId, setFilter, fetchList]);

  // Export to Excel (CSV)
  const handleExportCSV = () => {
    if (registrations.length === 0) {
      alert('출력할 내역이 없습니다.');
      return;
    }

    const headers = ['이름', '성별', '생년월일', '연락처', '이메일', '소속', '신청종목', '참가비합계', '입금여부', '취소여부', '접수일시'];
    const rows = registrations.map((r) => {
      const joinsStr = r.joins ? r.joins.map((j) => `${j.contestCategoryTitle}(${j.contestGradeTitle})`).join('; ') : '';
      return [
        r.playerName,
        r.playerGender === 'm' ? '남성' : '여성',
        r.playerBirth,
        r.playerTel,
        r.playerEmail || '',
        r.playerGym,
        joinsStr,
        r.contestPriceTotal,
        r.isPriceCheck ? '완료' : '대기',
        r.isCanceled ? '취소' : '정상',
        r.submittedAt
      ];
    });

    // Add BOM (\uFEFF) to prevent Korean encoding issues in Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    let activeContestTitle = '전체';
    if (filters.contestId) {
      const found = contests.find(c => c.id === filters.contestId);
      if (found) activeContestTitle = found.title;
    }

    link.setAttribute('href', url);
    link.setAttribute('download', `대회접수자명단_${activeContestTitle}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenDetail = (reg: Registration) => {
    setSelectedReg(reg);
    setIsDetailOpen(true);
  };

  const handleOpenEdit = (reg: Registration) => {
    setFormTarget(reg);
    setIsFormOpen(true);
  };

  const handleOpenCreate = () => {
    setFormTarget(null);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: '접수 내역 삭제',
      message: `정말로 ${name} 참가자의 접수 내역을 삭제(취소)하시겠습니까?`,
      confirmText: '삭제',
      cancelText: '취소',
      type: 'danger',
      onConfirm: async () => {
        // 모달을 일단 닫음
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        
        // 실제 삭제(취소) 작업 수행
        const success = await toggleCancelStatus(id, true);
        if (success) {
          // 완료 성공 알림 모달 노출
          setConfirmConfig({
            isOpen: true,
            title: '삭제 완료',
            message: '삭제(접수 취소) 처리되었습니다.',
            confirmText: '확인',
            type: 'success',
            onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
          });
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleRestore = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: '접수 내역 복원',
      message: `정말로 ${name} 참가자의 접수 내역을 다시 정상 상태로 복원하시겠습니까?`,
      confirmText: '복원',
      cancelText: '취소',
      type: 'success',
      onConfirm: async () => {
        // 모달을 일단 닫음
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        
        // 실제 복원(취소 해제) 작업 수행
        const success = await toggleCancelStatus(id, false);
        if (success) {
          // 완료 성공 알림 모달 노출
          setConfirmConfig({
            isOpen: true,
            title: '복원 완료',
            message: '성공적으로 복원(정상 접수 전환) 처리되었습니다.',
            confirmText: '확인',
            type: 'success',
            onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
          });
        }
      },
      onCancel: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(price);
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return isoStr;
    }
  };

  const renderMobileCardList = () => {
    if (registrations.length === 0) {
      return (
        <div className="no-data">
          조건에 해당하는 대회 신청 내역이 없습니다.
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {registrations.map((reg) => (
          <div 
            key={reg.id} 
            className="mobile-reg-card"
            style={{ opacity: reg.isCanceled ? 0.6 : 1 }}
          >
            {/* 1행: 이름 & 삭제/복원 버튼 */}
            <div className="card-row">
              <div>
                <span 
                  style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--color-text-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => handleOpenDetail(reg)}
                >
                  {reg.playerName}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                  ({reg.playerGender === 'm' ? '남' : '여'})
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  className="btn-icon" 
                  style={{ width: '28px', height: '28px' }} 
                  title="수정"
                  onClick={() => handleOpenEdit(reg)}
                  disabled={reg.isCanceled}
                >
                  <Edit2 size={12} />
                </button>
                {reg.isCanceled ? (
                  <button 
                    className="btn-icon" 
                    style={{ width: '28px', height: '28px', borderColor: 'var(--color-accent)' }} 
                    title="복원"
                    onClick={() => handleRestore(reg.id, reg.playerName)}
                  >
                    <RotateCcw size={12} style={{ color: 'var(--color-accent)' }} />
                  </button>
                ) : (
                  <button 
                    className="btn-icon danger" 
                    style={{ width: '28px', height: '28px' }} 
                    title="삭제"
                    onClick={() => handleDelete(reg.id, reg.playerName)}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="card-divider" />

            {/* 2행: 소속, 연락처 */}
            <div className="card-row">
              <div className="card-info-item">
                <span className="info-label">소속</span>
                <span className="info-value">{reg.playerGym}</span>
              </div>
              <div className="card-info-item" style={{ alignItems: 'flex-end' }}>
                <span className="info-label">연락처</span>
                <span className="info-value">{reg.playerTel}</span>
              </div>
            </div>

            {/* 3행: 세부 종목 수, 참가비 */}
            <div className="card-row">
              <div className="card-info-item">
                <span className="info-label">신청 종목 수</span>
                <span className="info-value">
                  <span className="badge success" style={{ padding: '2px 8px' }}>{reg.joins?.length || 0} 종목</span>
                </span>
              </div>
              <div className="card-info-item" style={{ alignItems: 'flex-end' }}>
                <span className="info-label">참가비 합계</span>
                <span className="info-value" style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                  {formatPrice(reg.contestPriceTotal)}
                </span>
              </div>
            </div>

            <div className="card-divider" />

            {/* 4행: 입금 확인 토글 */}
            <div className="card-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="info-label" style={{ textTransform: 'none', letterSpacing: 'normal' }}>상태:</span>
                <span className={`badge ${reg.isCanceled ? 'danger' : reg.isPriceCheck ? 'success' : 'warning'}`}>
                  {reg.isCanceled ? '취소됨' : reg.isPriceCheck ? '입금완료' : '미입금대기'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="info-label">입금 확인:</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={reg.isPriceCheck}
                    onChange={(e) => togglePaymentStatus(reg.id, e.target.checked, staff)}
                    disabled={reg.isCanceled}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Table Controls (Search, Filters, Action buttons) */}
      <div className="table-controls">
        <div className="controls-left">
          {/* Contest filter bar (only shown to general staff/admin who can manage multiple contests) */}
          {!staff?.contestId && (
            <select
              className="form-select"
              style={{ width: '220px', margin: 0 }}
              value={filters.contestId}
              onChange={(e) => setFilter('contestId', e.target.value)}
              disabled={isLoading}
            >
              <option value="">전체 대회</option>
              {contests.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}

          {/* Payment Filter */}
          <select
            className="form-select"
            style={{ width: '160px', margin: 0 }}
            value={filters.isPriceCheck}
            onChange={(e) => setFilter('isPriceCheck', e.target.value)}
            disabled={isLoading}
          >
            <option value="all">입금여부 (전체)</option>
            <option value="true">입금완료</option>
            <option value="false">미입금대기</option>
          </select>

          {/* Cancel Filter */}
          <select
            className="form-select"
            style={{ width: '160px', margin: 0 }}
            value={filters.isCanceled}
            onChange={(e) => setFilter('isCanceled', e.target.value)}
            disabled={isLoading}
          >
            <option value="all">취소여부 (전체)</option>
            <option value="false">정상 접수건</option>
            <option value="true">접수 취소건</option>
          </select>

          {/* Keyword Search */}
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="이름 또는 연락처 검색"
              value={filters.keyword}
              onChange={(e) => setFilter('keyword', e.target.value)}
            />
          </div>

          {/* Reset Filters */}
          <button 
            type="button" 
            className="btn-icon" 
            title="필터 초기화"
            onClick={() => resetFilters(staff?.contestId || '')}
            disabled={isLoading}
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="controls-right">
          {/* Firebase Sync */}
          <button
            type="button"
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px', backgroundColor: 'rgba(210, 255, 0, 0.1)', borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
            onClick={handleSyncFirestore}
            disabled={isLoading || isSyncing}
            title="Firebase 원장 데이터를 기준으로 D1 서버 DB 동기화"
          >
            <RefreshCw size={16} className={isSyncing ? 'spin' : ''} />
            {isSyncing ? '동기화 중...' : 'Firebase 동기화'}
          </button>

          {/* Excel Export */}
          <button
            type="button"
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}
            onClick={handleExportCSV}
            disabled={isLoading || registrations.length === 0}
          >
            <FileSpreadsheet size={16} style={{ color: 'var(--color-accent)' }} />
            엑셀 다운로드
          </button>

          {/* Create Manual Registration */}
          {filters.contestId && (
            <button
              type="button"
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              수동 접수 등록
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="no-data">접수 데이터를 불러오는 중입니다...</div>
      ) : isMobile ? (
        renderMobileCardList()
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>입금확인</th>
                <th>참가선수</th>
                <th>소속 (Gym)</th>
                <th>연락처</th>
                <th>최종결제액</th>
                <th style={{ textAlign: 'center' }}>종목수</th>
                <th>취소여부</th>
                <th>접수시각</th>
                <th style={{ width: '120px', textAlign: 'center' }}>관리기능</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="no-data">
                    조건에 해당하는 대회 신청 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => (
                  <tr key={reg.id} style={{ opacity: reg.isCanceled ? 0.5 : 1 }}>
                    {/* Price check toggle */}
                    <td style={{ textAlign: 'center' }}>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={reg.isPriceCheck}
                          onChange={(e) => togglePaymentStatus(reg.id, e.target.checked, staff)}
                          disabled={reg.isCanceled}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>

                    {/* Participant name */}
                    <td>
                      <span 
                        style={{ fontWeight: 'bold', color: 'var(--color-text-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => handleOpenDetail(reg)}
                      >
                        {reg.playerName}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                        ({reg.playerGender === 'm' ? '남' : '여'})
                      </span>
                    </td>

                    {/* Gym */}
                    <td>{reg.playerGym}</td>

                    {/* Tel */}
                    <td>{reg.playerTel}</td>

                    {/* Total Price */}
                    <td style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                      {formatPrice(reg.contestPriceTotal)}
                    </td>

                    {/* Number of Joins */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge success">{reg.joins?.length || 0}</span>
                    </td>

                    {/* Canceled check switch/badge */}
                    <td>
                      <span 
                        className={`badge ${reg.isCanceled ? 'danger' : 'success'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleCancelStatus(reg.id, !reg.isCanceled)}
                      >
                        {reg.isCanceled ? <ShieldAlert size={12} /> : <CheckCircle2 size={12} />}
                        {reg.isCanceled ? '취소됨' : '정상접수'}
                      </span>
                    </td>

                    {/* Date */}
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {formatDate(reg.submittedAt)}
                    </td>

                    {/* Operations */}
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button 
                          className="btn-icon" 
                          style={{ width: '28px', height: '28px' }} 
                          title="상세 보기"
                          onClick={() => handleOpenDetail(reg)}
                        >
                          <Eye size={12} />
                        </button>
                        <button 
                          className="btn-icon" 
                          style={{ width: '28px', height: '28px' }} 
                          title="수정"
                          onClick={() => handleOpenEdit(reg)}
                          disabled={reg.isCanceled}
                        >
                          <Edit2 size={12} />
                        </button>
                        {reg.isCanceled ? (
                          <button 
                            className="btn-icon" 
                            style={{ width: '28px', height: '28px', borderColor: 'var(--color-accent)' }} 
                            title="복원 (접수 원복)"
                            onClick={() => handleRestore(reg.id, reg.playerName)}
                          >
                            <RotateCcw size={12} style={{ color: 'var(--color-accent)' }} />
                          </button>
                        ) : (
                          <button 
                            className="btn-icon danger" 
                            style={{ width: '28px', height: '28px' }} 
                            title="삭제 (접수 취소)"
                            onClick={() => handleDelete(reg.id, reg.playerName)}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {isDetailOpen && (
        <RegistrationDetailModal 
          registration={selectedReg} 
          onClose={() => setIsDetailOpen(false)} 
        />
      )}

      {isFormOpen && (
        <RegistrationFormModal
          key={formTarget?.id || 'new'}
          registration={formTarget}
          contestId={filters.contestId || staff?.contestId || ''}
          onClose={() => setIsFormOpen(false)}
          onSave={saveRegistration}
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
