import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useContest } from '../../hooks/useContest';
import { authService } from '../../services/authService';
import { contestService } from '../../services/contestService';
import type { Registration } from '../../services/contestService';
import type { SimpleContest } from '../../services/authService';
import { 
  Camera, Upload, Download, CheckCircle2, AlertCircle, 
  Search, ChevronDown, ChevronRight, X, Trash2, Eye, RefreshCw,
  Plus, ExternalLink, Trophy, Sparkles
} from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';
import { uploadToR2 } from '../../services/uploadToR2Service';
import { batchProcessAllStagePhotos, resetAllPublicStagePhotos } from '../../services/batchWatermarkService';

interface CategoryGroup {
  categoryTitle: string;
  grades: {
    gradeTitle: string;
    players: Registration[];
  }[];
}

export default function PhotoManagementPage() {
  const navigate = useNavigate();
  const { staff } = useAuth();
  const { registrations, isLoading, filters, fetchList, setFilter, updatePlayerPhotos } = useContest();
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

  // Batch Branding State
  const [batchState, setBatchState] = useState<{
    isOpen: boolean;
    isRunning: boolean;
    totalContestPlayers: number;
    validPhotoPlayersCount: number;
    skippedNoPhotoCount: number;
    total: number;
    current: number;
    percent: number;
    currentPlayerName: string;
    status: 'idle' | 'running' | 'done' | 'error';
    successCount: number;
    failCount: number;
    totalPhotosProcessed: number;
  }>({
    isOpen: false,
    isRunning: false,
    totalContestPlayers: 0,
    validPhotoPlayersCount: 0,
    skippedNoPhotoCount: 0,
    total: 0,
    current: 0,
    percent: 0,
    currentPlayerName: '',
    status: 'idle',
    successCount: 0,
    failCount: 0,
    totalPhotosProcessed: 0,
  });

  // 전체 선수 일괄 자동 브랜딩 실행 (9회 대회 또는 현재 선택된 대회 기준)
  const handleRunBatchBranding = async () => {
    const targetContestId = filters.contestId || staff?.contestId || '';

    setBatchState({
      isOpen: true,
      isRunning: true,
      totalContestPlayers: registrations.length,
      validPhotoPlayersCount: 0,
      skippedNoPhotoCount: 0,
      total: 0,
      current: 0,
      percent: 0,
      currentPlayerName: '대회 선수 데이터 및 사진 검증 중...',
      status: 'running',
      successCount: 0,
      failCount: 0,
      totalPhotosProcessed: 0,
    });

    try {
      const result = await batchProcessAllStagePhotos(
        registrations,
        targetContestId,
        {
          preset: 'official_stamp',
          subText: '용인시보디빌딩협회',
          text: 'ybbf.org'
        },
        (progress) => {
          setBatchState(prev => ({
            ...prev,
            total: progress.total,
            current: progress.current,
            percent: progress.percent,
            currentPlayerName: progress.currentPlayerName,
            totalPhotosProcessed: progress.processedSlots
          }));
        }
      );

      setBatchState(prev => ({
        ...prev,
        isRunning: false,
        status: 'done',
        totalContestPlayers: result.totalContestPlayers,
        validPhotoPlayersCount: result.validPhotoPlayersCount,
        skippedNoPhotoCount: result.skippedNoPhotoCount,
        successCount: result.successPlayerCount,
        failCount: result.failPlayerCount,
        totalPhotosProcessed: result.totalPhotosProcessed,
      }));

      fetchList();
    } catch (err: any) {
      alert('일괄 브랜딩 실행 중 오류: ' + (err.message || '알 수 없는 오류'));
      setBatchState(prev => ({ ...prev, isRunning: false, status: 'error' }));
    }
  };

  // 9회 대회 가공된 공개용 사진 전체 초기화
  const handleResetAllPublicPhotos = () => {
    const targetContestId = filters.contestId || staff?.contestId || '';
    setConfirmConfig({
      isOpen: true,
      title: '공개용 무대 사진 전체 초기화',
      message: '9회 대회의 가공된 공개용 사진(publicStagePhoto1, 2)을 모두 비우고 초기화하시겠습니까?\n\n⚠️ 선수의 원본 사진은 100% 안전하게 유지됩니다.',
      confirmText: '초기화 실행',
      cancelText: '취소',
      type: 'danger',
      onConfirm: async () => {
        try {
          const resetCount = await resetAllPublicStagePhotos(registrations, targetContestId);
          alert(`총 ${resetCount}명의 공개용 사진 슬롯이 초기화되었습니다.`);
          fetchList();
        } catch (err: any) {
          alert('초기화 실패: ' + err.message);
        }
      }
    });
  };

  // 🏆 개별 선수 출전 종목 성적 및 순위 변경
  const handleUpdateJoinRank = async (regId: string, joinIdx: number, awardValue: string) => {
    const reg = registrations.find(r => r.id === regId);
    if (!reg) return;

    const newJoins = [...(reg.joins || [])];
    if (!newJoins[joinIdx]) return;

    let rankNum: number | undefined = undefined;
    let isGp = false;

    if (awardValue === '기본') {
      newJoins[joinIdx] = {
        ...newJoins[joinIdx],
        rank: undefined,
        award: undefined,
        isGrandPrix: false
      };
    } else {
      if (awardValue.includes('1위') || awardValue.includes('체급 우승')) rankNum = 1;
      if (awardValue.includes('2위')) rankNum = 2;
      if (awardValue.includes('3위')) rankNum = 3;
      if (awardValue.includes('TOP 5')) rankNum = 4;
      if (awardValue.includes('그랑프리')) {
        rankNum = 1;
        isGp = true;
      }

      newJoins[joinIdx] = {
        ...newJoins[joinIdx],
        rank: rankNum,
        award: awardValue,
        isGrandPrix: isGp
      };
    }

    try {
      await contestService.updatePlayerJoinResults(regId, newJoins, isGp ? '그랑프리 우승 (OVERALL CHAMPION)' : undefined);
      fetchList();
    } catch (err: any) {
      alert('성적 저장 오류: ' + (err.message || err));
    }
  };

  // 🏆 대회 공식 성적 일괄 동기화 알림/실행
  const handleSyncContestAwards = async () => {
    if (!window.confirm('대회 채점 심사 데이터에서 순위(체급 우승, 그랑프리, 입상)를 가져와 모든 선수 쇼케이스와 마이페이지에 실시간 반영하시겠습니까?')) {
      return;
    }
    try {
      await fetchList();
      alert('✨ 대회 성적 및 순위가 쇼케이스와 마이페이지에 실시간 동기화되었습니다!');
    } catch (err: any) {
      alert('동기화 실패: ' + err.message);
    }
  };

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
    // 1. photos 풀 배열 정리 (기존 사진들 중복 제거 및 누락 방지)
    const allPhotos: string[] = [];
    const sourcePhotos = reg.photos || reg.playerPhotoUrls || [];
    sourcePhotos.forEach(url => {
      if (url && !allPhotos.includes(url)) allPhotos.push(url);
    });
    if (reg.playerPhotoUrl && !allPhotos.includes(reg.playerPhotoUrl)) {
      allPhotos.unshift(reg.playerPhotoUrl);
    }
    if (photoUrl && !allPhotos.includes(photoUrl)) {
      allPhotos.push(photoUrl);
    }

    let slot1 = reg.stagePhoto1 || reg.selectedPhotoUrls?.[0] || '';
    let slot2 = reg.stagePhoto2 || reg.selectedPhotoUrls?.[1] || '';

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

    try {
      await updatePlayerPhotos(reg, allPhotos, [slot1, slot2], slot1, slot2);
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
    if (file.size > 10 * 1024 * 1024) {
      setConfirmConfig({
        isOpen: true,
        title: '용량 제한 초과',
        message: '사진 파일 크기는 10MB 이하로 업로드해 주세요.',
        confirmText: '확인',
        type: 'danger',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setIsUploadingMap(prev => ({ ...prev, [reg.id]: true }));

    try {
      // 1. Cloudflare R2로 이미지 파일 직접 업로드 (고해상도 CDN URL 획득)
      const playerIdentifier = reg.playerUid || reg.playerTel || reg.id;
      const uploadedR2Url = await uploadToR2(file, `contest_player_${playerIdentifier}`, true);

      if (!uploadedR2Url) {
        throw new Error('업로드된 사진 주소를 가져오지 못했습니다.');
      }

      // 2. photos 배열에 새로 업로드한 사진 추가 (원본/가공본 모두 보관)
      const currentPhotos: string[] = [];
      const sourcePhotos = reg.photos || reg.playerPhotoUrls || [];
      sourcePhotos.forEach(url => {
        if (url && !currentPhotos.includes(url)) currentPhotos.push(url);
      });
      if (reg.playerPhotoUrl && !currentPhotos.includes(reg.playerPhotoUrl)) {
        currentPhotos.unshift(reg.playerPhotoUrl);
      }
      if (!currentPhotos.includes(uploadedR2Url)) {
        currentPhotos.push(uploadedR2Url);
      }

      // 3. stagePhoto1, stagePhoto2 슬롯 지정
      let slot1 = reg.stagePhoto1 || reg.selectedPhotoUrls?.[0] || '';
      let slot2 = reg.stagePhoto2 || reg.selectedPhotoUrls?.[1] || '';

      if (targetSlot === 1) {
        slot1 = uploadedR2Url;
        if (slot2 === uploadedR2Url) slot2 = '';
      } else if (targetSlot === 2) {
        slot2 = uploadedR2Url;
        if (slot1 === uploadedR2Url) slot1 = '';
      } else {
        // targetSlot 미지정 시: 1번이 비어있으면 1번으로, 1번이 차있고 2번이 비어있으면 2번으로 배정
        if (!slot1) {
          slot1 = uploadedR2Url;
        } else if (!slot2 && slot1 !== uploadedR2Url) {
          slot2 = uploadedR2Url;
        }
      }

      await updatePlayerPhotos(reg, currentPhotos, [slot1, slot2], slot1, slot2);

      const slotLabel = targetSlot ? `대회용 ${targetSlot}번 사진` : '새 사진';
      setConfirmConfig({
        isOpen: true,
        title: '업로드 완료',
        message: `${reg.playerName} 선수의 ${slotLabel}이 성공적으로 등록되었습니다.`,
        confirmText: '확인',
        type: 'success',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    } catch (err: any) {
      console.error('업로드 실패:', err);
      setConfirmConfig({
        isOpen: true,
        title: '업로드 오류',
        message: '사진 업로드 중 오류가 발생했습니다: ' + (err.message || '서버 오류'),
        confirmText: '확인',
        type: 'danger',
        onConfirm: () => setConfirmConfig(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setIsUploadingMap(prev => ({ ...prev, [reg.id]: false }));
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
          const rawPhotos = reg.photos || reg.playerPhotoUrls || [];
          const currentPhotos = rawPhotos.filter(u => u !== photoUrl);
          let slot1 = reg.stagePhoto1 || reg.selectedPhotoUrls?.[0] || '';
          let slot2 = reg.stagePhoto2 || reg.selectedPhotoUrls?.[1] || '';

          if (slot1 === photoUrl) slot1 = '';
          if (slot2 === photoUrl) slot2 = '';

          await updatePlayerPhotos(reg, currentPhotos, [slot1, slot2], slot1, slot2);
          if (lightboxPhoto?.url === photoUrl) {
            setLightboxPhoto(null);
          }
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* 대회 성적 실시간 동기화 버튼 */}
          <button
            onClick={handleSyncContestAwards}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              borderRadius: '10px',
              color: '#facc15',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(234, 179, 8, 0.15)',
              transition: 'all 0.2s ease'
            }}
            title="대회 심사 결과의 순위/성적을 모든 선수 쇼케이스와 마이페이지에 실시간 동기화합니다"
          >
            <Trophy size={16} />
            대회 성적 및 순위 동기화
          </button>

          {/* 전체 선수 일괄 자동 브랜딩 버튼 */}
          <button
            onClick={handleRunBatchBranding}
            disabled={isLoading || batchState.isRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: 'rgba(210, 255, 0, 0.15)',
              border: '1px solid rgba(210, 255, 0, 0.4)',
              borderRadius: '10px',
              color: '#d2ff00',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(210, 255, 0, 0.15)',
              transition: 'all 0.2s ease'
            }}
            title="모든 선수의 무대 1번과 2번 사진을 일괄 자동 가공하여 공개용으로 저장합니다"
          >
            <Sparkles size={16} />
            ⚡️ 전체 선수 무대 사진 일괄 자동 브랜딩
          </button>

          {/* 공개용 가공 사진 일괄 초기화 버튼 */}
          <button
            onClick={handleResetAllPublicPhotos}
            disabled={isLoading || batchState.isRunning}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              color: '#fca5a5',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="가공된 공개용 무대 사진만 초기화합니다 (원본 사진은 안전하게 보존됩니다)"
          >
            <Trash2 size={15} />
            🧹 가공본 초기화
          </button>

          <button 
            onClick={() => fetchList()} 
            disabled={isLoading || batchState.isRunning}
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
      {isLoading && registrations.length === 0 ? (
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
                            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '18px' }}>
                              {gradeGroup.players.map((reg) => {
                                const allPhotos: string[] = [];
                                const sourcePhotos = reg.photos || reg.playerPhotoUrls || [];
                                sourcePhotos.forEach(url => {
                                  if (url && !allPhotos.includes(url)) allPhotos.push(url);
                                });
                                if (reg.playerPhotoUrl && !allPhotos.includes(reg.playerPhotoUrl)) {
                                  allPhotos.unshift(reg.playerPhotoUrl);
                                }
                                
                                const slot1 = reg.stagePhoto1 || reg.selectedPhotoUrls?.[0] || '';
                                const slot2 = reg.stagePhoto2 || reg.selectedPhotoUrls?.[1] || '';
                                const hasPhotos = allPhotos.length > 0;
                                const isUploading = isUploadingMap[reg.id];

                                return (
                                  <div 
                                    key={reg.id}
                                    style={{
                                      backgroundColor: '#1e293b',
                                      borderRadius: '14px',
                                      border: `1px solid ${hasPhotos ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.4)'}`,
                                      padding: '20px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      justifyContent: 'space-between',
                                      gap: '16px',
                                      boxShadow: '0 6px 12px -2px rgba(0, 0, 0, 0.25)'
                                    }}
                                  >
                                    {/* Player Info Line */}
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                                        <div>
                                          <span style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginRight: '8px' }}>
                                            {reg.playerName}
                                          </span>
                                          <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                                            ({reg.playerGender === 'm' ? '남' : '여'}, {reg.playerBirth})
                                          </span>
                                        </div>

                                        {/* Photo Status & MyPage Preview Links */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <a
                                            href={`http://localhost:4100/showcase/${encodeURIComponent(reg.id || reg.playerUid || '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              fontSize: '11px',
                                              fontWeight: 700,
                                              backgroundColor: 'rgba(210, 255, 0, 0.12)',
                                              color: '#d2ff00',
                                              border: '1px solid rgba(210, 255, 0, 0.35)',
                                              padding: '4px 9px',
                                              borderRadius: '6px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              textDecoration: 'none',
                                              transition: 'all 0.2s ease'
                                            }}
                                            title="선수 공개 무대 쇼케이스 페이지 새 창 열기"
                                          >
                                            <ExternalLink size={12} /> 공개 쇼케이스
                                          </a>
                                          <a
                                            href={`http://localhost:4100/mypage?previewUid=${encodeURIComponent(reg.playerUid || reg.id)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              fontSize: '11px',
                                              fontWeight: 700,
                                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                              color: '#93c5fd',
                                              border: '1px solid rgba(147, 197, 253, 0.3)',
                                              padding: '4px 9px',
                                              borderRadius: '6px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              textDecoration: 'none',
                                              transition: 'all 0.2s ease'
                                            }}
                                            title="선수 시점 마이페이지 새 창으로 검수"
                                          >
                                            <ExternalLink size={12} /> 마이페이지 뷰
                                          </a>

                                          {hasPhotos ? (
                                            <span style={{
                                              fontSize: '11px',
                                              fontWeight: 700,
                                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                              color: '#34d399',
                                              border: '1px solid rgba(16, 185, 129, 0.4)',
                                              padding: '4px 9px',
                                              borderRadius: '6px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px'
                                            }}>
                                              <CheckCircle2 size={13} /> 사진 {allPhotos.length}장
                                            </span>
                                          ) : (
                                            <span style={{
                                              fontSize: '11px',
                                              fontWeight: 700,
                                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                              color: '#f87171',
                                              border: '1px solid rgba(239, 68, 68, 0.4)',
                                              padding: '4px 9px',
                                              borderRadius: '6px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px'
                                            }}>
                                              <AlertCircle size={13} /> 사진 누락
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '10px' }}>
                                        <div>연락처: <span style={{ color: '#cbd5e1' }}>{reg.playerTel}</span></div>
                                        <div>소속: <span style={{ color: '#cbd5e1' }}>{reg.playerGym}</span></div>
                                      </div>

                                      {/* Contest & Public Photo Designation Status Pills */}
                                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {/* 대회 무대용 원본 슬롯 */}
                                        {slot1 ? (
                                          <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            🏆 무대 1번 지정됨
                                          </span>
                                        ) : (
                                          <span style={{ fontSize: '11px', fontWeight: 500, backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', border: '1px dashed rgba(255, 255, 255, 0.2)', padding: '3px 8px', borderRadius: '6px' }}>
                                            무대 1번 미지정
                                          </span>
                                        )}

                                        {slot2 ? (
                                          <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            🥈 무대 2번 지정됨
                                          </span>
                                        ) : (
                                          <span style={{ fontSize: '11px', fontWeight: 500, backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', border: '1px dashed rgba(255, 255, 255, 0.2)', padding: '3px 8px', borderRadius: '6px' }}>
                                            무대 2번 미지정
                                          </span>
                                        )}

                                        {/* 공개용 ybbf.org 브랜딩 슬롯 */}
                                        {reg.publicStagePhoto1 ? (
                                          <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(210, 255, 0, 0.15)', color: '#d2ff00', border: '1px solid rgba(210, 255, 0, 0.4)', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            🌐 공개용 1번 완료
                                          </span>
                                        ) : null}

                                        {reg.publicStagePhoto2 ? (
                                          <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: 'rgba(210, 255, 0, 0.15)', color: '#d2ff00', border: '1px solid rgba(210, 255, 0, 0.4)', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            🌐 공개용 2번 완료
                                          </span>
                                        ) : null}
                                      </div>

                                      {/* 🏆 대회 공식 성적 & 입상 순위 관리 바 */}
                                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <Trophy size={13} color="#d2ff00" /> 출전 종목별 대회 성적 / 순위 부여:
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                          {(reg.joins || []).map((join, joinIdx) => {
                                            const currentAward = join.award || (join.rank ? `${join.rank}위` : '기본');
                                            const isChamp = currentAward.includes('우승') || currentAward.includes('그랑프리');

                                            return (
                                              <div 
                                                key={joinIdx} 
                                                style={{ 
                                                  display: 'flex', 
                                                  alignItems: 'center', 
                                                  justifyContent: 'space-between', 
                                                  backgroundColor: '#0f172a', 
                                                  padding: '6px 10px', 
                                                  borderRadius: '8px', 
                                                  border: isChamp ? '1px solid rgba(210, 255, 0, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)' 
                                                }}
                                              >
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
                                                  {join.contestCategoryTitle} <span style={{ color: '#d2ff00', fontSize: '10px', fontWeight: 700 }}>({join.contestGradeTitle})</span>
                                                </span>
                                                <select
                                                  value={currentAward}
                                                  onChange={(e) => handleUpdateJoinRank(reg.id, joinIdx, e.target.value)}
                                                  style={{
                                                    backgroundColor: isChamp ? 'rgba(210, 255, 0, 0.15)' : '#1e293b',
                                                    color: isChamp ? '#d2ff00' : '#f8fafc',
                                                    border: isChamp ? '1px solid #d2ff00' : '1px solid rgba(255, 255, 255, 0.15)',
                                                    borderRadius: '6px',
                                                    padding: '3px 8px',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    outline: 'none'
                                                  }}
                                                >
                                                  <option value="기본">⚡ 본선 진출 (기본)</option>
                                                  <option value="체급 우승 (1위)">🥇 1위 (체급 우승)</option>
                                                  <option value="그랑프리 우승 (Grand Prix)">👑 그랑프리 우승 (Grand Prix)</option>
                                                  <option value="2위 (준우승)">🥈 2위 (준우승)</option>
                                                  <option value="3위 (입상)">🥉 3위 (입상)</option>
                                                  <option value="TOP 5 (공식 입상)">🎖️ TOP 5 (공식 입상)</option>
                                                </select>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Photos List / Upload Section */}
                                    <div>
                                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>등록된 사진 풀 ({allPhotos.length}장)</span>
                                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>[1번] [2번] 버튼: 대회용 지정 • [🪄 브랜딩]: 워터마크 가공</span>
                                      </div>

                                      {hasPhotos ? (
                                        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
                                          {allPhotos.map((url, pIdx) => {
                                            const isSlot1 = slot1 === url;
                                            const isSlot2 = slot2 === url;

                                            return (
                                              <div 
                                                key={pIdx}
                                                style={{
                                                  position: 'relative',
                                                  width: '150px',
                                                  height: '195px',
                                                  borderRadius: '10px',
                                                  overflow: 'hidden',
                                                  border: `2px solid ${isSlot1 ? '#10b981' : (isSlot2 ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)')}`,
                                                  backgroundColor: '#000',
                                                  flexShrink: 0,
                                                  boxShadow: isSlot1 ? '0 0 12px rgba(16, 185, 129, 0.25)' : (isSlot2 ? '0 0 12px rgba(59, 130, 246, 0.25)' : 'none')
                                                }}
                                              >
                                                {/* Thumbnail Image */}
                                                <img 
                                                  src={url} 
                                                  alt={`선수 사진 ${pIdx + 1}`}
                                                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                                  onClick={() => setLightboxPhoto({ registration: reg, photoIndex: pIdx, url })}
                                                />

                                                {/* Slot 1 Badge */}
                                                {isSlot1 && (
                                                  <div style={{
                                                    position: 'absolute',
                                                    top: '6px',
                                                    left: '6px',
                                                    backgroundColor: '#10b981',
                                                    color: '#fff',
                                                    fontSize: '11px',
                                                    fontWeight: 900,
                                                    padding: '3px 7px',
                                                    borderRadius: '5px',
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.7)'
                                                  }}>
                                                    🏆 1번 메인
                                                  </div>
                                                )}

                                                {/* Slot 2 Badge */}
                                                {isSlot2 && (
                                                  <div style={{
                                                    position: 'absolute',
                                                    top: '6px',
                                                    left: '6px',
                                                    backgroundColor: '#3b82f6',
                                                    color: '#fff',
                                                    fontSize: '11px',
                                                    fontWeight: 900,
                                                    padding: '3px 7px',
                                                    borderRadius: '5px',
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.7)'
                                                  }}>
                                                    🥈 2번 액션
                                                  </div>
                                                )}

                                                {/* Top Right: Magic Branding Studio Button (Prominent) */}
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    navigate(`/photos/studio?id=${encodeURIComponent(reg.id)}&url=${encodeURIComponent(url)}`);
                                                  }}
                                                  title="워터마크 지우기 & ybbf.org 브랜딩 스튜디오 전용 페이지로 이동"
                                                  style={{
                                                    position: 'absolute',
                                                    top: '6px',
                                                    right: '6px',
                                                    backgroundColor: 'rgba(210, 255, 0, 0.92)',
                                                    color: '#000',
                                                    fontSize: '11px',
                                                    fontWeight: 900,
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                                                    transition: 'all 0.2s ease'
                                                  }}
                                                >
                                                  <Sparkles size={13} />
                                                  <span>브랜딩</span>
                                                </button>

                                                {/* Bottom Action Bar */}
                                                <div style={{
                                                  position: 'absolute',
                                                  bottom: 0,
                                                  left: 0,
                                                  right: 0,
                                                  backgroundColor: 'rgba(0, 0, 0, 0.88)',
                                                  backdropFilter: 'blur(4px)',
                                                  padding: '5px 6px',
                                                  display: 'flex',
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center',
                                                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                                                }}>
                                                  {/* 1번 Toggle Button */}
                                                  <button
                                                    onClick={() => handleSetContestPhoto(reg, url, 1)}
                                                    title={isSlot1 ? '대회용 1번 해제' : '대회용 1번으로 지정'}
                                                    style={{
                                                      background: isSlot1 ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
                                                      border: isSlot1 ? '1px solid #059669' : '1px solid rgba(255, 255, 255, 0.25)',
                                                      color: '#fff',
                                                      fontSize: '11px',
                                                      fontWeight: 800,
                                                      padding: '3px 6px',
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
                                                      fontSize: '11px',
                                                      fontWeight: 800,
                                                      padding: '3px 6px',
                                                      borderRadius: '4px',
                                                      cursor: 'pointer'
                                                    }}
                                                  >
                                                    2번
                                                  </button>

                                                  {/* Zoom Preview */}
                                                  <button
                                                    onClick={() => setLightboxPhoto({ registration: reg, photoIndex: pIdx, url })}
                                                    title="크게 보기"
                                                    style={{ background: 'none', border: 'none', color: '#e5e7eb', cursor: 'pointer', padding: '3px' }}
                                                  >
                                                    <Eye size={16} />
                                                  </button>

                                                  {/* Download */}
                                                  <button
                                                    onClick={() => handleDownloadPhoto(url, reg.playerName, pIdx)}
                                                    title="다운로드"
                                                    style={{ background: 'none', border: 'none', color: '#e5e7eb', cursor: 'pointer', padding: '3px' }}
                                                  >
                                                    <Download size={16} />
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
              const curSlot1 = lightboxPhoto.registration.stagePhoto1 || lightboxPhoto.registration.selectedPhotoUrls?.[0] || '';
              const curSlot2 = lightboxPhoto.registration.stagePhoto2 || lightboxPhoto.registration.selectedPhotoUrls?.[1] || '';
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
                        let s1 = updatedReg.stagePhoto1 || updatedReg.selectedPhotoUrls?.[0] || '';
                        let s2 = updatedReg.stagePhoto2 || updatedReg.selectedPhotoUrls?.[1] || '';
                        if (s1 === lightboxPhoto.url) s1 = '';
                        else {
                          s1 = lightboxPhoto.url;
                          if (s2 === lightboxPhoto.url) s2 = '';
                        }
                        updatedReg.stagePhoto1 = s1;
                        updatedReg.stagePhoto2 = s2;
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
                        let s1 = updatedReg.stagePhoto1 || updatedReg.selectedPhotoUrls?.[0] || '';
                        let s2 = updatedReg.stagePhoto2 || updatedReg.selectedPhotoUrls?.[1] || '';
                        if (s2 === lightboxPhoto.url) s2 = '';
                        else {
                          s2 = lightboxPhoto.url;
                          if (s1 === lightboxPhoto.url) s1 = '';
                        }
                        updatedReg.stagePhoto1 = s1;
                        updatedReg.stagePhoto2 = s2;
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

                    {/* Magic Branding Studio in Lightbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        navigate(`/photos/studio?id=${encodeURIComponent(lightboxPhoto.registration.id)}&url=${encodeURIComponent(lightboxPhoto.url)}`);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        border: '1px solid rgba(210, 255, 0, 0.4)',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        backgroundColor: 'rgba(210, 255, 0, 0.15)',
                        color: '#d2ff00'
                      }}
                      title="워터마크 마스킹 & ybbf.org 브랜딩 스튜디오 전용 페이지로 이동"
                    >
                      <Sparkles size={15} /> 🪄 ybbf.org 브랜딩 가공 스튜디오 열기
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

      {/* Batch Processing Progress Modal */}
      {batchState.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#111812',
            border: '1px solid rgba(45, 74, 31, 0.9)',
            borderRadius: '18px',
            padding: '28px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            color: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(210, 255, 0, 0.15)',
                border: '1px solid rgba(210, 255, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d2ff00'
              }}>
                <Sparkles size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                  무대 사진 일괄 자동 브랜딩
                </h3>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  공식 2단 스탬프 (용인시보디빌딩협회 / ybbf.org)
                </span>
              </div>
            </div>

            {/* Status & Progress Bar */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
                <span style={{ color: '#d1d5db' }}>{batchState.currentPlayerName}</span>
                <span style={{ color: '#d2ff00', fontFamily: 'monospace' }}>
                  {batchState.current} / {batchState.total} ({batchState.percent}%)
                </span>
              </div>

              {/* Progress Bar Container */}
              <div style={{
                width: '100%',
                height: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  width: `${batchState.percent}%`,
                  height: '100%',
                  backgroundColor: '#10b981',
                  borderRadius: '6px',
                  transition: 'width 0.3s ease',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                }} />
              </div>
            </div>

            {/* Finished Summary or Running Notice */}
            {batchState.status === 'done' ? (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  fontWeight: 700
                }}>
                  <CheckCircle2 size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 900, marginBottom: '6px' }}>
                      일괄 자동 브랜딩 처리가 완료되었습니다!
                    </div>
                    <div style={{ fontSize: '12px', color: '#d1d5db', lineHeight: '1.6', fontWeight: 500 }}>
                      • 9회 대회 전체 선수: <strong style={{ color: '#ffffff' }}>{batchState.totalContestPlayers}명</strong><br />
                      • 무대 사진 보유 대상: <strong style={{ color: '#10b981' }}>{batchState.validPhotoPlayersCount}명</strong> ({batchState.totalPhotosProcessed}장 가공 및 R2 저장 완료)<br />
                      • 사진 미등록 선수: <strong style={{ color: '#9ca3af' }}>{batchState.skippedNoPhotoCount}명</strong> (안전하게 제외됨)
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '20px',
                fontSize: '12px',
                color: '#9ca3af',
                lineHeight: '1.6'
              }}>
                💡 9회 대회 선수 중 무대 사진이 있는 선수만 선별하여 Gemini 워터마크를 가리고 공식 <strong>'용인시보디빌딩협회 / ybbf.org'</strong> 뱃지를 합성하여 Cloudflare R2에 업로드 중입니다.
              </div>
            )}

            {/* Modal Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                disabled={batchState.isRunning}
                onClick={() => setBatchState(prev => ({ ...prev, isOpen: false }))}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: batchState.status === 'done' ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: batchState.isRunning ? 'not-allowed' : 'pointer',
                  opacity: batchState.isRunning ? 0.5 : 1
                }}
              >
                {batchState.status === 'done' ? '확인 및 완료' : '처리 중...'}
              </button>
            </div>
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
