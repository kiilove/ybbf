import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useContest } from '../../hooks/useContest';
import { contestService } from '../../services/contestService';
import { authService } from '../../services/authService';
import type { Registration } from '../../services/contestService';
import type { SimpleContest } from '../../services/authService';
import { 
  Camera, Upload, Download, CheckCircle2, AlertCircle, 
  Search, ChevronDown, ChevronRight, X, Trash2, Eye, RefreshCw,
  Plus
} from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';

interface CategoryGroup {
  categoryTitle: string;
  grades: {
    gradeTitle: string;
    players: Registration[];
  }[];
}

export default function PhotoManagementPage() {
  const { staff } = useAuth();
  const { registrations, isLoading, filters, fetchList, setFilter } = useContest();
  const [contests, setContests] = useState<SimpleContest[]>([]);
  
  // Filtering & View Mode State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'uploaded' | 'missing'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>({});
  
  // Lightbox Modal State
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    registration: Registration;
    photoIndex: number;
    url: string;
  } | null>(null);

  // Uploading state per player
  const [isUploadingMap, setIsUploadingMap] = useState<Record<string, boolean>>({});

  // Confirm / Alert Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'success' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Load contest list if staff has no fixed contestId
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

  // Initial fetch with contestId filter if staff is bound or filter is selected
  useEffect(() => {
    if (staff?.contestId) {
      setFilter('contestId', staff.contestId);
    } else if (filters.contestId) {
      fetchList();
    }
  }, [staff, filters.contestId, setFilter, fetchList]);

  // Group Registrations by Category -> Grade -> Player
  const groupedData = useMemo(() => {
    const categoryMap = new Map<string, Map<string, Map<string, Registration>>>();

    registrations.forEach((reg) => {
      // Filter by keyword if typed
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const matchName = reg.playerName.toLowerCase().includes(kw);
        const matchTel = reg.playerTel.includes(kw);
        const matchGym = reg.playerGym.toLowerCase().includes(kw);
        if (!matchName && !matchTel && !matchGym) return;
      }

      // Check photo existence
      const hasPhotos = Boolean(
        (reg.playerPhotoUrl && reg.playerPhotoUrl.trim() !== '') ||
        (reg.playerPhotoUrls && reg.playerPhotoUrls.length > 0)
      );

      if (photoFilter === 'uploaded' && !hasPhotos) return;
      if (photoFilter === 'missing' && hasPhotos) return;

      const joins = reg.joins && reg.joins.length > 0 
        ? reg.joins 
        : [{ contestCategoryTitle: '미지정 종목', contestGradeTitle: '미지정 체급', contestCategoryId: '', contestGradeId: '' }];

      joins.forEach((j) => {
        const catTitle = j.contestCategoryTitle || '기타 종목';
        const gradeTitle = j.contestGradeTitle || '일반 체급';

        if (!categoryMap.has(catTitle)) {
          categoryMap.set(catTitle, new Map());
        }
        const gradeMap = categoryMap.get(catTitle)!;
        if (!gradeMap.has(gradeTitle)) {
          gradeMap.set(gradeTitle, new Map());
        }
        const playerMap = gradeMap.get(gradeTitle)!;
        playerMap.set(reg.id, reg);
      });
    });

    const result: CategoryGroup[] = [];
    categoryMap.forEach((gradeMap, catTitle) => {
      const grades: { gradeTitle: string; players: Registration[] }[] = [];
      gradeMap.forEach((playerMap, gradeTitle) => {
        grades.push({
          gradeTitle,
          players: Array.from(playerMap.values())
        });
      });
      result.push({
        categoryTitle: catTitle,
        grades
      });
    });

    return result;
  }, [registrations, searchKeyword, photoFilter]);

  // Expand all accordion categories by default when data loads
  useEffect(() => {
    if (groupedData.length > 0 && Object.keys(expandedCategories).length === 0) {
      const initialCatState: Record<string, boolean> = {};
      const initialGradeState: Record<string, boolean> = {};
      groupedData.forEach(cat => {
        initialCatState[cat.categoryTitle] = true;
        cat.grades.forEach(g => {
          initialGradeState[`${cat.categoryTitle}_${g.gradeTitle}`] = true;
        });
      });
      setExpandedCategories(initialCatState);
      setExpandedGrades(initialGradeState);
    }
  }, [groupedData]);

  // Overall Statistics
  const stats = useMemo(() => {
    let total = registrations.length;
    let uploadedCount = 0;
    let missingCount = 0;

    registrations.forEach(r => {
      const hasPhoto = Boolean(
        (r.playerPhotoUrl && r.playerPhotoUrl.trim() !== '') ||
        (r.playerPhotoUrls && r.playerPhotoUrls.length > 0)
      );
      if (hasPhoto) uploadedCount++;
      else missingCount++;
    });

    return { total, uploadedCount, missingCount };
  }, [registrations]);

  const toggleCategory = (catTitle: string) => {
    setExpandedCategories(prev => ({ ...prev, [catTitle]: !prev[catTitle] }));
  };

  const toggleGrade = (catTitle: string, gradeTitle: string) => {
    const key = `${catTitle}_${gradeTitle}`;
    setExpandedGrades(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Photo Download Handler
  const handleDownloadPhoto = (url: string, playerName: string, index: number) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${playerName}_선수_사진_${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  // 대회용 1번 또는 2번 사진 직접 지정/해제 핸들러
  const handleSetContestPhoto = async (reg: Registration, photoUrl: string, slot: 1 | 2) => {
    const allPhotos: string[] = [];
    if (reg.playerPhotoUrls && reg.playerPhotoUrls.length > 0) {
      reg.playerPhotoUrls.forEach(url => {
        if (url && !allPhotos.includes(url)) allPhotos.push(url);
      });
    }
    if (reg.playerPhotoUrl && !allPhotos.includes(reg.playerPhotoUrl)) {
      allPhotos.unshift(reg.playerPhotoUrl);
    }

    let slot1 = reg.selectedPhotoUrls?.[0] || '';
    let slot2 = reg.selectedPhotoUrls?.[1] || '';

    if (slot === 1) {
      if (slot1 === photoUrl) {
        // 이미 1번이면 해제
        slot1 = '';
      } else {
        slot1 = photoUrl;
        // 기존 2번에 동일 사진이 지정되어 있었다면 2번 슬롯 비움
        if (slot2 === photoUrl) slot2 = '';
      }
    } else if (slot === 2) {
      if (slot2 === photoUrl) {
        // 이미 2번이면 해제
        slot2 = '';
      } else {
        slot2 = photoUrl;
        // 기존 1번에 동일 사진이 지정되어 있었다면 1번 슬롯 비움
        if (slot1 === photoUrl) slot1 = '';
      }
    }

    const updatedSelected: string[] = [slot1, slot2];

    try {
      await contestService.updatePlayerPhotos(reg, allPhotos, updatedSelected);
      await fetchList(false); // 새로고침
    } catch (err: any) {
      setConfirmConfig({
        isOpen: true,
        title: '저장 실패',
        message: '대회용 사진 지정 상태를 저장하지 못했습니다: ' + err.message,
        confirmText: '확인',
        type: 'danger',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  // Upload Photo for Player (특정 슬롯 1번/2번 지정 업로드 또는 일반 추가)
  const handleUploadFile = async (reg: Registration, file: File, targetSlot?: 1 | 2) => {
    if (file.size > 3 * 1024 * 1024) {
      setConfirmConfig({
        isOpen: true,
        title: '용량 제한 초과',
        message: '사진 파일 크기는 3MB 이하로 업로드해 주세요.',
        confirmText: '확인',
        type: 'danger',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setIsUploadingMap(prev => ({ ...prev, [reg.id]: true }));

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        // 1. 기존 업로드 사진 풀 목록 정리 (원본/가공본 모두 보관)
        const currentPhotos: string[] = [];
        if (reg.playerPhotoUrls && reg.playerPhotoUrls.length > 0) {
          reg.playerPhotoUrls.forEach(url => {
            if (url && !currentPhotos.includes(url)) currentPhotos.push(url);
          });
        }
        if (reg.playerPhotoUrl && !currentPhotos.includes(reg.playerPhotoUrl)) {
          currentPhotos.unshift(reg.playerPhotoUrl);
        }
        if (!currentPhotos.includes(dataUrl)) {
          currentPhotos.push(dataUrl);
        }

        // 2. 대회용 1번 / 2번 지정 로직
        let slot1 = reg.selectedPhotoUrls?.[0] || '';
        let slot2 = reg.selectedPhotoUrls?.[1] || '';

        if (targetSlot === 1) {
          slot1 = dataUrl;
          if (slot2 === dataUrl) slot2 = '';
        } else if (targetSlot === 2) {
          slot2 = dataUrl;
          if (slot1 === dataUrl) slot1 = '';
        } else {
          // targetSlot 미지정 시: 1번이 비어있으면 1번으로, 1번이 차있고 2번이 비어있으면 2번으로 배정
          if (!slot1) {
            slot1 = dataUrl;
          } else if (!slot2 && slot1 !== dataUrl) {
            slot2 = dataUrl;
          }
        }

        const updatedSelected: string[] = [slot1, slot2];

        await contestService.updatePlayerPhotos(reg, currentPhotos, updatedSelected);
        await fetchList(false);

        const slotLabel = targetSlot ? `대회용 ${targetSlot}번 사진` : '새 사진';
        setConfirmConfig({
          isOpen: true,
          title: '업로드 완료',
          message: `${reg.playerName} 선수의 ${slotLabel}이 성공적으로 등록되었습니다.`,
          confirmText: '확인',
          type: 'success',
          onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
        });

        setIsUploadingMap(prev => ({ ...prev, [reg.id]: false }));
      };

      reader.onerror = () => {
        throw new Error('파일을 읽는 중 오류가 발생했습니다.');
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploadingMap(prev => ({ ...prev, [reg.id]: false }));
      setConfirmConfig({
        isOpen: true,
        title: '업로드 오류',
        message: '사진 업로드 중 오류가 발생했습니다: ' + err.message,
        confirmText: '확인',
        type: 'danger',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  // Delete Photo from Player
  const handleDeletePhoto = (reg: Registration, photoUrl: string) => {
    setConfirmConfig({
      isOpen: true,
      title: '사진 삭제 확인',
      message: `${reg.playerName} 선수의 선택된 사진을 정말 삭제하시겠습니까?`,
      confirmText: '삭제',
      cancelText: '취소',
      type: 'danger',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        try {
          const currentPhotos = (reg.playerPhotoUrls || []).filter(u => u !== photoUrl);
          const currentSelected = (reg.selectedPhotoUrls || []).filter(u => u !== photoUrl);

          await contestService.updatePlayerPhotos(reg, currentPhotos, currentSelected);
          if (lightboxPhoto?.url === photoUrl) {
            setLightboxPhoto(null);
          }
          await fetchList();
        } catch (err: any) {
          alert('사진 삭제 실패: ' + err.message);
        }
      }
    });
  };

  return (
    <div style={{ padding: '24px 16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f3f4f6', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Camera style={{ color: 'var(--color-primary, #6366f1)' }} size={28} />
            선수 사진 관리
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>
            종목 및 체급별 참가 선수의 사진을 확인하고 누락된 사진을 업로드하거나 대회용 대표 사진(최대 2장)을 체크할 수 있습니다.
          </p>
        </div>

        <button 
          onClick={() => fetchList()} 
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--color-divider)',
            borderRadius: '8px',
            color: '#e5e7eb',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} className={isLoading ? 'spin-animation' : ''} />
          목록 새로고침
        </button>
      </div>

      {/* Contest Selector Bar (for multi-contest staff) */}
      {!staff?.contestId && contests.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '14px 18px', backgroundColor: 'var(--color-surface-card)', borderRadius: '12px', border: '1px solid var(--color-divider)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#d1d5db' }}>대회 선택:</span>
          <select
            value={filters.contestId || ''}
            onChange={(e) => setFilter('contestId', e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#1f2937',
              color: '#f3f4f6',
              border: '1px solid var(--color-divider)',
              borderRadius: '6px',
              fontSize: '14px',
              maxWidth: '300px'
            }}
          >
            <option value="">전체 대회 보기</option>
            {contests.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Statistics Cards Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-divider)', borderRadius: '12px', padding: '18px 20px' }}>
          <div style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>전체 선수 수</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#f3f4f6', marginTop: '6px' }}>{stats.total}명</div>
        </div>
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '18px 20px' }}>
          <div style={{ fontSize: '13px', color: '#34d399', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} /> 사진 등록 완료
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>{stats.uploadedCount}명</div>
        </div>
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '18px 20px' }}>
          <div style={{ fontSize: '13px', color: '#f87171', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={16} /> 사진 미제출 (누락)
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444', marginTop: '6px' }}>{stats.missingCount}명</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px', 
        flexWrap: 'wrap',
        backgroundColor: 'var(--color-surface-card)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--color-divider)',
        alignItems: 'center'
      }}>
        {/* Search input */}
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <input
            type="text"
            placeholder="선수 이름, 연락처, 소속 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              backgroundColor: '#111827',
              border: '1px solid var(--color-divider)',
              borderRadius: '8px',
              color: '#f3f4f6',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Photo Status Filter buttons */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: '#111827', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-divider)' }}>
          <button
            onClick={() => setPhotoFilter('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: photoFilter === 'all' ? 'var(--color-primary, #6366f1)' : 'transparent',
              color: photoFilter === 'all' ? '#fff' : '#9ca3af'
            }}
          >
            전체 보기 ({stats.total})
          </button>
          <button
            onClick={() => setPhotoFilter('uploaded')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: photoFilter === 'uploaded' ? '#10b981' : 'transparent',
              color: photoFilter === 'uploaded' ? '#fff' : '#9ca3af'
            }}
          >
            사진 등록 ({stats.uploadedCount})
          </button>
          <button
            onClick={() => setPhotoFilter('missing')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: photoFilter === 'missing' ? '#ef4444' : 'transparent',
              color: photoFilter === 'missing' ? '#fff' : '#9ca3af'
            }}
          >
            사진 누락 ({stats.missingCount})
          </button>
        </div>
      </div>

      {/* Main Category -> Grade -> Player Tree List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
          <RefreshCw size={32} className="spin-animation" style={{ marginBottom: '12px' }} />
          <div>선수 목록 및 사진 정보를 불러오는 중입니다...</div>
        </div>
      ) : groupedData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: 'var(--color-surface-card)', borderRadius: '12px', border: '1px solid var(--color-divider)', color: '#9ca3af' }}>
          <AlertCircle size={40} style={{ marginBottom: '12px', color: '#6b7280' }} />
          <div style={{ fontSize: '16px', fontWeight: 600 }}>조회된 선수 데이터가 없습니다.</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>검색어나 필터 조건을 변경해 주세요.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {groupedData.map((catGroup) => {
            const isCatExpanded = expandedCategories[catGroup.categoryTitle] ?? true;
            const categoryPlayerCount = catGroup.grades.reduce((sum, g) => sum + g.players.length, 0);

            return (
              <div 
                key={catGroup.categoryTitle}
                style={{
                  backgroundColor: 'var(--color-surface-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-divider)',
                  overflow: 'hidden'
                }}
              >
                {/* 1 Level: Category Header */}
                <div 
                  onClick={() => toggleCategory(catGroup.categoryTitle)}
                  style={{
                    padding: '16px 20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: isCatExpanded ? '1px solid var(--color-divider)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isCatExpanded ? <ChevronDown size={20} color="#a5b4fc" /> : <ChevronRight size={20} color="#9ca3af" />}
                    <span style={{ fontSize: '17px', fontWeight: 700, color: '#f3f4f6' }}>
                      {catGroup.categoryTitle}
                    </span>
                    <span style={{ fontSize: '12px', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      총 {categoryPlayerCount}명
                    </span>
                  </div>
                </div>

                {/* Category Body */}
                {isCatExpanded && (
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {catGroup.grades.map((gradeGroup) => {
                      const gradeKey = `${catGroup.categoryTitle}_${gradeGroup.gradeTitle}`;
                      const isGradeExpanded = expandedGrades[gradeKey] ?? true;

                      return (
                        <div 
                          key={gradeGroup.gradeTitle}
                          style={{
                            backgroundColor: '#0f172a',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            overflow: 'hidden'
                          }}
                        >
                          {/* 2 Level: Grade Header */}
                          <div 
                            onClick={() => toggleGrade(catGroup.categoryTitle, gradeGroup.gradeTitle)}
                            style={{
                              padding: '12px 16px',
                              backgroundColor: 'rgba(255, 255, 255, 0.02)',
                              borderBottom: isGradeExpanded ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isGradeExpanded ? <ChevronDown size={16} color="#94a3b8" /> : <ChevronRight size={16} color="#64748b" />}
                              <span style={{ fontSize: '15px', fontWeight: 600, color: '#cbd5e1' }}>
                                체급: {gradeGroup.gradeTitle}
                              </span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              {gradeGroup.players.length}명
                            </span>
                          </div>

                          {/* 3 Level: Player Cards Grid */}
                          {isGradeExpanded && (
                            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                              {gradeGroup.players.map((reg) => {
                                const allPhotos: string[] = [];
                                if (reg.playerPhotoUrls && reg.playerPhotoUrls.length > 0) {
                                  reg.playerPhotoUrls.forEach(url => {
                                    if (url && !allPhotos.includes(url)) allPhotos.push(url);
                                  });
                                }
                                if (reg.playerPhotoUrl && !allPhotos.includes(reg.playerPhotoUrl)) {
                                  allPhotos.unshift(reg.playerPhotoUrl);
                                }
                                
                                const slot1 = reg.selectedPhotoUrls?.[0] || '';
                                const slot2 = reg.selectedPhotoUrls?.[1] || '';
                                const hasPhotos = allPhotos.length > 0;
                                const isUploading = isUploadingMap[reg.id];

                                return (
                                  <div 
                                    key={reg.id}
                                    style={{
                                      backgroundColor: '#1e293b',
                                      borderRadius: '12px',
                                      border: `1px solid ${hasPhotos ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.4)'}`,
                                      padding: '18px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between',
                                      gap: '14px',
                                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                  >
                                    {/* Player Info Line */}
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                                        <div>
                                          <span style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', marginRight: '8px' }}>
                                            {reg.playerName}
                                          </span>
                                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                            ({reg.playerGender === 'm' ? '남' : '여'}, {reg.playerBirth})
                                          </span>
                                        </div>

                                        {/* Photo Status Badge */}
                                        {hasPhotos ? (
                                          <span style={{
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                            color: '#34d399',
                                            border: '1px solid rgba(16, 185, 129, 0.4)',
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}>
                                            <CheckCircle2 size={12} /> 사진 {allPhotos.length}장
                                          </span>
                                        ) : (
                                          <span style={{
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                            color: '#f87171',
                                            border: '1px solid rgba(239, 68, 68, 0.4)',
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}>
                                            <AlertCircle size={12} /> 사진 누락
                                          </span>
                                        )}
                                      </div>

                                      <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
                                        <div>연락처: <span style={{ color: '#cbd5e1' }}>{reg.playerTel}</span></div>
                                        <div>소속: <span style={{ color: '#cbd5e1' }}>{reg.playerGym}</span></div>
                                      </div>

                                      {/* Contest Photo Designation Status Pills */}
                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {slot1 ? (
                                          <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            🏆 대회용 1번 지정됨
                                          </span>
                                        ) : (
                                          <span style={{ fontSize: '11px', fontWeight: 500, backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', border: '1px dashed rgba(255, 255, 255, 0.2)', padding: '3px 8px', borderRadius: '6px' }}>
                                            대회용 1번 미지정
                                          </span>
                                        )}

                                        {slot2 ? (
                                          <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            🥈 대회용 2번 지정됨
                                          </span>
                                        ) : (
                                          <span style={{ fontSize: '11px', fontWeight: 500, backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', border: '1px dashed rgba(255, 255, 255, 0.2)', padding: '3px 8px', borderRadius: '6px' }}>
                                            대회용 2번 미지정
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Photos List / Upload Section */}
                                    <div>
                                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>등록된 사진 풀 ({allPhotos.length}장)</span>
                                        <span style={{ fontSize: '11px', color: '#64748b' }}>[1번] [2번] 버튼으로 대회용 사진 지정</span>
                                      </div>

                                      {hasPhotos ? (
                                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                                          {allPhotos.map((url, pIdx) => {
                                            const isSlot1 = slot1 === url;
                                            const isSlot2 = slot2 === url;

                                            return (
                                              <div 
                                                key={pIdx}
                                                style={{
                                                  position: 'relative',
                                                  width: '94px',
                                                  height: '118px',
                                                  borderRadius: '8px',
                                                  overflow: 'hidden',
                                                  border: `2px solid ${isSlot1 ? '#10b981' : (isSlot2 ? '#3b82f6' : 'rgba(255, 255, 255, 0.12)')}`,
                                                  backgroundColor: '#000',
                                                  flexShrink: 0
                                                }}
                                              >
                                                {/* Thumbnail Image */}
                                                <img 
                                                  src={url} 
                                                  alt={`선수 사진 ${pIdx + 1}`}
                                                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                                  onClick={() => setLightboxPhoto({ registration: reg, photoIndex: pIdx, url })}
                                                />

                                                {/* Designation Badge */}
                                                {isSlot1 && (
                                                  <div style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    left: '4px',
                                                    backgroundColor: '#10b981',
                                                    color: '#fff',
                                                    fontSize: '10px',
                                                    fontWeight: 800,
                                                    padding: '2px 5px',
                                                    borderRadius: '4px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.6)'
                                                  }}>
                                                    🏆 1번
                                                  </div>
                                                )}

                                                {isSlot2 && (
                                                  <div style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    left: '4px',
                                                    backgroundColor: '#3b82f6',
                                                    color: '#fff',
                                                    fontSize: '10px',
                                                    fontWeight: 800,
                                                    padding: '2px 5px',
                                                    borderRadius: '4px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.6)'
                                                  }}>
                                                    🥈 2번
                                                  </div>
                                                )}

                                                {/* Action Overlay Buttons */}
                                                <div style={{
                                                  position: 'absolute',
                                                  bottom: 0,
                                                  left: 0,
                                                  right: 0,
                                                  backgroundColor: 'rgba(0, 0, 0, 0.82)',
                                                  padding: '3px 4px',
                                                  display: 'flex',
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center'
                                                }}>
                                                  {/* 1번 Toggle Button */}
                                                  <button
                                                    onClick={() => handleSetContestPhoto(reg, url, 1)}
                                                    title={isSlot1 ? '대회용 1번 해제' : '대회용 1번으로 지정'}
                                                    style={{
                                                      background: isSlot1 ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
                                                      border: isSlot1 ? '1px solid #059669' : '1px solid rgba(255, 255, 255, 0.25)',
                                                      color: '#fff',
                                                      fontSize: '10px',
                                                      fontWeight: 800,
                                                      padding: '2px 4px',
                                                      borderRadius: '4px',
                                                      cursor: 'pointer'
                                                    }}
                                                  >
                                                    1번
                                                  </button>

                                                  {/* 2번 Toggle Button */}
                                                  <button
                                                    onClick={() => handleSetContestPhoto(reg, url, 2)}
                                                    title={isSlot2 ? '대회용 2번 해제' : '대회용 2번으로 지정'}
                                                    style={{
                                                      background: isSlot2 ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)',
                                                      border: isSlot2 ? '1px solid #2563eb' : '1px solid rgba(255, 255, 255, 0.25)',
                                                      color: '#fff',
                                                      fontSize: '10px',
                                                      fontWeight: 800,
                                                      padding: '2px 4px',
                                                      borderRadius: '4px',
                                                      cursor: 'pointer'
                                                    }}
                                                  >
                                                    2번
                                                  </button>

                                                  {/* Zoom Preview */}
                                                  <button
                                                    onClick={() => setLightboxPhoto({ registration: reg, photoIndex: pIdx, url })}
                                                    title="확대 보기"
                                                    style={{ background: 'none', border: 'none', color: '#e5e7eb', cursor: 'pointer', padding: '2px' }}
                                                  >
                                                    <Eye size={13} />
                                                  </button>

                                                  {/* Download */}
                                                  <button
                                                    onClick={() => handleDownloadPhoto(url, reg.playerName, pIdx)}
                                                    title="다운로드"
                                                    style={{ background: 'none', border: 'none', color: '#e5e7eb', cursor: 'pointer', padding: '2px' }}
                                                  >
                                                    <Download size={13} />
                                                  </button>

                                                  {/* Delete */}
                                                  <button
                                                    onClick={() => handleDeletePhoto(reg, url)}
                                                    title="삭제"
                                                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                                                  >
                                                    <Trash2 size={13} />
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div style={{
                                          padding: '16px',
                                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                          borderRadius: '8px',
                                          border: '1px dashed rgba(239, 68, 68, 0.3)',
                                          textAlign: 'center',
                                          fontSize: '13px',
                                          color: '#f87171',
                                          marginBottom: '10px'
                                        }}>
                                          등록된 사진이 없습니다.
                                        </div>
                                      )}
                                    </div>

                                    {/* Dedicated Upload Buttons Group */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: '6px' }}>
                                      {/* Slot 1 Upload */}
                                      <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        padding: '8px 6px',
                                        backgroundColor: isUploading ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                                        border: '1px solid rgba(16, 185, 129, 0.35)',
                                        borderRadius: '8px',
                                        color: '#34d399',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: isUploading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box',
                                        textAlign: 'center'
                                      }}>
                                        <Upload size={13} />
                                        1번 업로드
                                        <input
                                          type="file"
                                          accept="image/*"
                                          style={{ display: 'none' }}
                                          disabled={isUploading}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUploadFile(reg, file, 1);
                                            e.target.value = '';
                                          }}
                                        />
                                      </label>

                                      {/* Slot 2 Upload */}
                                      <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        padding: '8px 6px',
                                        backgroundColor: isUploading ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                                        border: '1px solid rgba(59, 130, 246, 0.35)',
                                        borderRadius: '8px',
                                        color: '#60a5fa',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: isUploading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box',
                                        textAlign: 'center'
                                      }}>
                                        <Upload size={13} />
                                        2번 업로드
                                        <input
                                          type="file"
                                          accept="image/*"
                                          style={{ display: 'none' }}
                                          disabled={isUploading}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUploadFile(reg, file, 2);
                                            e.target.value = '';
                                          }}
                                        />
                                      </label>

                                      {/* General Upload */}
                                      <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        padding: '8px 6px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid var(--color-divider)',
                                        borderRadius: '8px',
                                        color: '#9ca3af',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: isUploading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        boxSizing: 'border-box',
                                        textAlign: 'center'
                                      }}>
                                        <Plus size={13} />
                                        사진 추가
                                        <input
                                          type="file"
                                          accept="image/*"
                                          style={{ display: 'none' }}
                                          disabled={isUploading}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUploadFile(reg, file);
                                            e.target.value = '';
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Photo Zoom Modal */}
      {lightboxPhoto && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setLightboxPhoto(null)}
        >
          <div 
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              border: '1px solid var(--color-divider)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#1e293b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--color-divider)'
            }}>
              <div>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginRight: '8px' }}>
                  {lightboxPhoto.registration.playerName} 선수 사진
                </span>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  ({lightboxPhoto.photoIndex + 1}번째 이미지)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Download Button */}
                <button
                  onClick={() => handleDownloadPhoto(lightboxPhoto.url, lightboxPhoto.registration.playerName, lightboxPhoto.photoIndex)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid var(--color-primary, #6366f1)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={16} /> 다운로드
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setLightboxPhoto(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Lightbox Image Preview Body */}
            <div style={{
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxHeight: '70vh',
              overflow: 'hidden',
              backgroundColor: '#000'
            }}>
              <img 
                src={lightboxPhoto.url} 
                alt="확대 이미지" 
                style={{
                  maxWidth: '100%',
                  maxHeight: '68vh',
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
              />
            </div>

            {/* Lightbox Footer Actions */}
            {(() => {
              const curSlot1 = lightboxPhoto.registration.selectedPhotoUrls?.[0] || '';
              const curSlot2 = lightboxPhoto.registration.selectedPhotoUrls?.[1] || '';
              const isCur1 = curSlot1 === lightboxPhoto.url;
              const isCur2 = curSlot2 === lightboxPhoto.url;

              return (
                <div style={{
                  padding: '14px 20px',
                  backgroundColor: '#1e293b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--color-divider)',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* 1번 버튼 */}
                    <button
                      onClick={async () => {
                        await handleSetContestPhoto(lightboxPhoto.registration, lightboxPhoto.url, 1);
                        const updatedReg = { ...lightboxPhoto.registration };
                        let s1 = updatedReg.selectedPhotoUrls?.[0] || '';
                        let s2 = updatedReg.selectedPhotoUrls?.[1] || '';
                        if (s1 === lightboxPhoto.url) s1 = '';
                        else {
                          s1 = lightboxPhoto.url;
                          if (s2 === lightboxPhoto.url) s2 = '';
                        }
                        updatedReg.selectedPhotoUrls = [s1, s2];
                        setLightboxPhoto(prev => prev ? { ...prev, registration: updatedReg } : null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        backgroundColor: isCur1 ? '#10b981' : 'rgba(16, 185, 129, 0.15)',
                        color: isCur1 ? '#fff' : '#34d399',
                        outline: isCur1 ? 'none' : '1px solid rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      🏆 {isCur1 ? '대회용 1번 해제' : '대회용 1번으로 지정'}
                    </button>

                    {/* 2번 버튼 */}
                    <button
                      onClick={async () => {
                        await handleSetContestPhoto(lightboxPhoto.registration, lightboxPhoto.url, 2);
                        const updatedReg = { ...lightboxPhoto.registration };
                        let s1 = updatedReg.selectedPhotoUrls?.[0] || '';
                        let s2 = updatedReg.selectedPhotoUrls?.[1] || '';
                        if (s2 === lightboxPhoto.url) s2 = '';
                        else {
                          s2 = lightboxPhoto.url;
                          if (s1 === lightboxPhoto.url) s1 = '';
                        }
                        updatedReg.selectedPhotoUrls = [s1, s2];
                        setLightboxPhoto(prev => prev ? { ...prev, registration: updatedReg } : null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        backgroundColor: isCur2 ? '#3b82f6' : 'rgba(59, 130, 246, 0.15)',
                        color: isCur2 ? '#fff' : '#60a5fa',
                        outline: isCur2 ? 'none' : '1px solid rgba(59, 130, 246, 0.4)'
                      }}
                    >
                      🥈 {isCur2 ? '대회용 2번 해제' : '대회용 2번으로 지정'}
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeletePhoto(lightboxPhoto.registration, lightboxPhoto.url)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '6px',
                      color: '#f87171',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={16} /> 이 사진 삭제
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Alert / Confirm Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
