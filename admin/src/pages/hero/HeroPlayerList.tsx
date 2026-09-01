import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import type { HeroPlayer } from '../../types/auth';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  UserPlus, 
  Info, 
  Zap, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  GripVertical, 
  Layers, 
  Crown,
  CheckCircle2
} from 'lucide-react';

// 카테고리 표준 권장 순위 (1. 일반부 -> 2. 비키니 -> 3. 클보 -> 4. 나머지)
function getStandardHeroRank(p: any): number {
  const name = (p.heroName || p.name || '').toLowerCase().trim();
  const cls = ((p.heroClass || '') + ' ' + (p.heroTitles || '')).toLowerCase();

  // 1. 일반부 보디빌딩 (강승민)
  if (
    name.includes('강승민') ||
    cls.includes('일반부') ||
    (cls.includes('보디빌딩') && !cls.includes('클래식') && !cls.includes('마스터즈') && !cls.includes('학생부') && !cls.includes('비키니'))
  ) {
    return 1;
  }
  // 2. 비키니 / 여자 스포츠 모델 (김민경)
  if (
    name.includes('김민경') ||
    cls.includes('비키니') ||
    cls.includes('bikini') ||
    cls.includes('여자')
  ) {
    return 2;
  }
  // 3. 클래식 보디빌딩 (유용수)
  if (
    name.includes('유용수') ||
    cls.includes('클래식') ||
    cls.includes('classic')
  ) {
    return 3;
  }
  // 4. 남자 스포츠 모델 (오근석)
  if (
    name.includes('오근석') ||
    cls.includes('스포츠 모델') ||
    cls.includes('스포츠모델')
  ) {
    return 4;
  }
  // 5. 마스터즈 (김광현)
  if (
    name.includes('김광현') ||
    cls.includes('마스터즈')
  ) {
    return 5;
  }
  // 6. 학생부 (한수만)
  if (
    name.includes('한수만') ||
    cls.includes('학생부')
  ) {
    return 6;
  }
  return 99;
}

export default function HeroPlayerList() {
  const { settings, isLoading, error, fetchSettings, saveSettings, deleteHeroPlayer } = useSystemSettings();
  const [syncing, setSyncing] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const heroPlayers: HeroPlayer[] = settings?.heroPlayers || [];

  // 1. 순서 이동 핸들러 (위로 / 아래로)
  const movePlayer = async (index: number, direction: 'up' | 'down') => {
    if (!settings || !settings.heroPlayers || reordering) return;
    const list = [...settings.heroPlayers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    setReordering(true);
    try {
      const temp = list[index];
      list[index] = list[targetIndex];
      list[targetIndex] = temp;

      // orderIndex 번호 자동 재부여
      list.forEach((p, idx) => {
        p.orderIndex = idx + 1;
      });

      const success = await saveSettings({
        ...settings,
        heroPlayers: list
      });
      if (success) {
        showFeedback(`✨ ${list[targetIndex].heroName} 선수의 노출 순서가 변경되었습니다.`);
        fetchSettings();
      }
    } finally {
      setReordering(false);
    }
  };

  // 2. orderIndex 직접 입력 변경 핸들러
  const handleDirectOrderChange = async (currentIndex: number, newOrderStr: string) => {
    const newOrder = parseInt(newOrderStr, 10);
    if (isNaN(newOrder) || newOrder < 1 || !settings || !settings.heroPlayers || reordering) return;
    
    const targetIndex = Math.min(Math.max(newOrder - 1, 0), settings.heroPlayers.length - 1);
    if (targetIndex === currentIndex) return;

    setReordering(true);
    try {
      const list = [...settings.heroPlayers];
      const [movedItem] = list.splice(currentIndex, 1);
      list.splice(targetIndex, 0, movedItem);

      list.forEach((p, idx) => {
        p.orderIndex = idx + 1;
      });

      const success = await saveSettings({
        ...settings,
        heroPlayers: list
      });
      if (success) {
        showFeedback(`✨ ${movedItem.heroName} 선수가 ${targetIndex + 1}번 노출 순서로 이동되었습니다.`);
        fetchSettings();
      }
    } finally {
      setReordering(false);
    }
  };

  // 3. 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex || !settings || !settings.heroPlayers) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setReordering(true);
    try {
      const list = [...settings.heroPlayers];
      const [draggedItem] = list.splice(draggedIndex, 1);
      list.splice(dropIndex, 0, draggedItem);

      list.forEach((p, idx) => {
        p.orderIndex = idx + 1;
      });

      const success = await saveSettings({
        ...settings,
        heroPlayers: list
      });
      if (success) {
        showFeedback(`✨ ${draggedItem.heroName} 선수를 ${dropIndex + 1}번 위치로 이동했습니다.`);
        fetchSettings();
      }
    } finally {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setReordering(false);
    }
  };

  // 4. 다관왕(2관왕/3관왕) 자동 병합 핸들러
  const handleMergeMultiCrowns = async () => {
    if (!settings || !settings.heroPlayers || settings.heroPlayers.length === 0 || reordering) return;

    if (!window.confirm('같은 선수의 복수 그랑프리(예: 김민경 - 비키니 & 여자 스포츠 모델)를 하나의 [다관왕] 카드로 자동 병합하시겠습니까?')) {
      return;
    }

    setReordering(true);
    try {
      const map = new Map<string, HeroPlayer>();
      const orderKeys: string[] = [];

      settings.heroPlayers.forEach((p) => {
        const nameKey = (p.heroName || '').trim();
        if (!nameKey) return;

        const rawClass = (p.heroClass || '')
          .replace(/\(오버롤\)/g, '')
          .replace(/그랑프리/g, '')
          .replace(/\(\d+관왕\)/g, '')
          .trim();

        if (map.has(nameKey)) {
          const existing = map.get(nameKey)!;
          const currentClasses = existing.classes || (existing.heroClass ? existing.heroClass.split(/[·&,]/).map(s => s.trim()).filter(Boolean) : []);
          
          if (rawClass && !currentClasses.includes(rawClass)) {
            currentClasses.push(rawClass);
          }

          const distinctCount = currentClasses.length;
          existing.classes = currentClasses;
          existing.crownCount = distinctCount;
          existing.isMultiCrown = distinctCount >= 2;
          existing.crownBadge = distinctCount >= 2 ? `${distinctCount}관왕` : '';
          existing.heroClass = distinctCount >= 2 ? `${currentClasses.join(' · ')} (${distinctCount}관왕)` : currentClasses.join(' · ');
          existing.heroTitles = `2026 제9회 용인특례시 보디빌딩대회 ${currentClasses.join(' & ')}${distinctCount >= 2 ? ` ${distinctCount}관왕` : ''} 오버롤 그랑프리`;

          if (!existing.stagePhoto2 && (p.stagePhoto1 || p.stagePhoto2 || p.heroImageUrl)) {
            existing.stagePhoto2 = p.stagePhoto2 || p.stagePhoto1 || p.heroImageUrl;
          }
        } else {
          orderKeys.push(nameKey);
          let initialClasses: string[] = [];
          if (nameKey === '김민경') {
            initialClasses = ['비키니', '여자 스포츠 모델'];
          } else if (rawClass) {
            initialClasses = [rawClass];
          }

          const isMulti = initialClasses.length >= 2;
          const count = isMulti ? initialClasses.length : 1;

          map.set(nameKey, {
            ...p,
            classes: initialClasses,
            isMultiCrown: isMulti,
            crownCount: count,
            crownBadge: isMulti ? `${count}관왕` : '',
            heroClass: isMulti ? `${initialClasses.join(' · ')} (${count}관왕)` : p.heroClass
          });
        }
      });

      const mergedList = orderKeys.map(k => map.get(k)!).filter(Boolean);
      mergedList.forEach((p, idx) => {
        p.orderIndex = idx + 1;
      });

      const success = await saveSettings({
        ...settings,
        heroPlayers: mergedList
      });

      if (success) {
        showFeedback(`🎉 다관왕 선수가 성공적으로 통합되었습니다! (총 ${mergedList.length}명 구성)`);
        fetchSettings();
      }
    } finally {
      setReordering(false);
    }
  };

  // 5. 공식 권장 순서(1.일반부 → 2.비키니 → 3.클보 → 4.나머지)로 일괄 자동 정렬
  const handleApplyRecommendedOrder = async () => {
    if (!settings || !settings.heroPlayers || settings.heroPlayers.length === 0 || reordering) return;
    if (!window.confirm('히어로 섹션을 공식 권장 순서 (1.일반부(강승민) → 2.비키니(김민경) → 3.클보(유용수) → 4.스포츠모델(오근석) → 5.마스터즈 → 6.학생부)로 자동 정렬하시겠습니까?')) {
      return;
    }
    setReordering(true);
    try {
      const sorted = [...settings.heroPlayers].sort((a, b) => getStandardHeroRank(a) - getStandardHeroRank(b));
      sorted.forEach((p, idx) => {
        p.orderIndex = idx + 1;
      });

      const success = await saveSettings({
        ...settings,
        heroPlayers: sorted
      });
      if (success) {
        showFeedback('✅ 공식 권장 순서로 정렬되어 메인 화면에 즉시 반영되었습니다!');
        fetchSettings();
      }
    } finally {
      setReordering(false);
    }
  };

  // 6. 대회 공식 결과 D1 자동 동기화
  const handleSyncFromContest = async () => {
    if (!window.confirm('대회 공식 결과(D1)에서 6인의 그랑프리 챔피언 실데이터를 가져와 히어로 섹션을 자동 갱신하시겠습니까?')) {
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch('https://ybbf-api-worker.jbkim.workers.dev/api/contests/vEsEClzzEHCnZ1d8azo1/auto-roster');
      const data = await res.json();
      if (!data.success || !data.legends) {
        throw new Error('대회 레전드 데이터를 불러오지 못했습니다.');
      }

      // 1) 데이터 매핑
      const rawMapped = data.legends.map((l: any) => ({
        id: l.id || `hero-gp-${encodeURIComponent(l.name)}`,
        heroName: l.name,
        heroClass: l.class || '오버롤 그랑프리',
        heroHeight: l.height ? String(l.height) : '',
        heroWeight: l.weight ? String(l.weight) : '',
        heroConditioning: '99.5',
        heroGym: l.gym || '용인시보디빌딩협회',
        heroTitles: `2026 제9회 용인특례시 보디빌딩대회 ${l.class} 챔피언`,
        stagePhoto1: l.stagePhoto1 || l.profileImage || '',
        stagePhoto2: l.stagePhoto2 || '',
        heroImageUrl: l.stagePhoto1 || l.profileImage || '',
        heroInstagram: '#',
        heroYoutube: '#',
        heroFacebook: '#'
      }));

      // 2) 다관왕 스마트 병합
      const map = new Map<string, any>();
      rawMapped.forEach((p: any) => {
        const k = (p.heroName || '').trim();
        if (!k) return;
        if (map.has(k)) {
          const ex = map.get(k);
          const cList = ex.classes || [ex.heroClass];
          if (!cList.includes(p.heroClass)) cList.push(p.heroClass);
          ex.classes = cList;
          ex.crownCount = cList.length;
          ex.isMultiCrown = cList.length >= 2;
          ex.crownBadge = `${cList.length}관왕`;
          ex.heroClass = `${cList.join(' · ')} (${cList.length}관왕)`;
          if (!ex.stagePhoto2 && p.stagePhoto1) ex.stagePhoto2 = p.stagePhoto1;
        } else {
          map.set(k, {
            ...p,
            classes: [p.heroClass],
            isMultiCrown: false,
            crownCount: 1
          });
        }
      });

      const merged = Array.from(map.values());
      // 3) 기본 권장 순위로 자동 정렬
      merged.sort((a: any, b: any) => getStandardHeroRank(a) - getStandardHeroRank(b));
      merged.forEach((p, idx) => {
        p.orderIndex = idx + 1;
      });

      if (!settings) {
        throw new Error('시스템 설정을 불러오지 못했습니다.');
      }

      const success = await saveSettings({
        ...settings,
        heroPlayers: merged
      });

      if (success) {
        showFeedback(`✅ 대회 그랑프리 ${merged.length}인의 최신 실데이터로 히어로 섹션이 자동 동기화되었습니다!`);
        fetchSettings();
      }
    } catch (err: any) {
      alert('자동 동기화 실패: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`정말 ${name} 선수를 히어로 목록에서 삭제하시겠습니까?`)) {
      const success = await deleteHeroPlayer(id);
      if (success) {
        showFeedback(`🗑️ ${name} 선수가 목록에서 삭제되었습니다.`);
        fetchSettings();
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">히어로 섹션 선수 목록</h1>
          <p className="page-subtitle">랜딩페이지 상단 히어로 영역에 노출되는 대표 선수들의 순서와 다관왕 설정을 관리합니다.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleMergeMultiCrowns}
            disabled={reordering || heroPlayers.length === 0}
            className="btn btn-secondary"
            style={{ backgroundColor: '#faf5ff', color: '#7e22ce', borderColor: '#e9d5ff', fontWeight: 600 }}
            title="동일 선수 복수 종목을 1개의 다관왕 카드로 자동 통합"
          >
            <Layers size={16} />
            <span>다관왕 자동 통합</span>
          </button>

          <button
            onClick={handleApplyRecommendedOrder}
            disabled={reordering || heroPlayers.length === 0}
            className="btn btn-secondary"
            style={{ backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe', fontWeight: 600 }}
            title="1.일반부(강승민) → 2.비키니(김민경) → 3.클보(유용수) 순서로 자동 배치"
          >
            <Sparkles size={16} />
            <span>권장 순서 자동 정렬</span>
          </button>

          <button
            onClick={handleSyncFromContest}
            disabled={syncing}
            className="btn btn-secondary"
            style={{ backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0', fontWeight: 600 }}
          >
            <Zap size={16} />
            <span>{syncing ? '동기화 중...' : '대회 그랑프리 자동 동기화'}</span>
          </button>

          <button 
            onClick={() => navigate('/hero/new')} 
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>신규 선수 등록</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#166534',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontSize: '14px',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          <CheckCircle2 size={18} color="#16a34a" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert-message alert-error">
          <Info size={16} />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
          선수 목록을 불러오는 중입니다...
        </div>
      ) : heroPlayers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <UserPlus size={48} />
          </div>
          <h3 className="empty-title">등록된 선수가 없습니다</h3>
          <p className="empty-desc">우선 첫 번째 대표 선수를 등록하여 랜딩페이지의 메인을 꾸며보세요.</p>
          <button onClick={() => navigate('/hero/new')} className="btn btn-primary">
            신규 선수 등록하기
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>이동</th>
                <th style={{ width: '90px', textAlign: 'center' }}>노출 순서</th>
                <th>선수 프로필</th>
                <th>출전 종목 / 타이틀</th>
                <th>신장 / 체중</th>
                <th>소속</th>
                <th style={{ textAlign: 'right', width: '220px' }}>순서 조정 / 관리</th>
              </tr>
            </thead>
            <tbody>
              {heroPlayers.map((player, index) => {
                const isFirst = index === 0;
                const isLast = index === heroPlayers.length - 1;
                const isDragged = draggedIndex === index;
                const isDragOver = dragOverIndex === index;
                const isMulti = Boolean(player.isMultiCrown || (player.crownCount && player.crownCount >= 2) || (player.heroClass && player.heroClass.includes('관왕')));

                return (
                  <tr 
                    key={player.id || index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    style={{
                      cursor: 'grab',
                      opacity: isDragged ? 0.4 : 1,
                      backgroundColor: isDragOver ? '#f0fdf4' : undefined,
                      borderTop: isDragOver ? '2px dashed #22c55e' : undefined,
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {/* 드래그 핸들 */}
                    <td style={{ textAlign: 'center', color: '#94a3b8' }}>
                      <GripVertical size={18} style={{ cursor: 'grab' }} />
                    </td>

                    {/* 노출 순번 입력/뱃지 */}
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <select
                          value={index + 1}
                          onChange={(e) => handleDirectOrderChange(index, e.target.value)}
                          disabled={reordering}
                          style={{
                            padding: '3px 6px',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '13px',
                            backgroundColor: isFirst ? '#fef08a' : '#f8fafc',
                            color: isFirst ? '#854d0e' : '#334155',
                            border: isFirst ? '2px solid #eab308' : '1px solid #cbd5e1',
                            cursor: 'pointer'
                          }}
                        >
                          {heroPlayers.map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i === 0 ? `👑 1순위` : `${i + 1}순위`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* 선수 프로필 */}
                    <td>
                      <div className="player-row-info">
                        {player.heroImageUrl ? (
                          <img 
                            src={player.heroImageUrl} 
                            alt={player.heroName} 
                            className="player-row-img" 
                            style={{ border: isFirst ? '2px solid #eab308' : '1px solid rgba(0,0,0,0.1)' }}
                          />
                        ) : (
                          <div className="player-row-placeholder">No Img</div>
                        )}
                        <div className="player-details">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="player-name" style={{ fontWeight: 800 }}>
                              {player.heroName}
                            </span>
                            {isFirst && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                backgroundColor: '#fef08a',
                                color: '#854d0e',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                border: '1px solid #eab308'
                              }}>
                                메인 1번
                              </span>
                            )}
                            {isMulti && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                backgroundColor: '#fae8ff',
                                color: '#86198f',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                border: '1px solid #f0abfc',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}>
                                <Crown size={10} />
                                {player.crownBadge || `${player.crownCount || 2}관왕`}
                              </span>
                            )}
                          </div>
                          <span className="player-class" style={{ color: '#16a34a', fontWeight: 600 }}>
                            {player.heroClass}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 출전 타이틀 */}
                    <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span className="user-role" style={{ fontSize: '12px' }}>{player.heroTitles}</span>
                    </td>

                    {/* 스펙 */}
                    <td>
                      <span style={{ fontWeight: '500', fontSize: '13px' }}>
                        {(player.heroHeight || player.heroWeight) 
                          ? `${player.heroHeight ? `${player.heroHeight}cm` : '-'} / ${player.heroWeight ? `${player.heroWeight}kg` : '-'}`
                          : '미기재'}
                      </span>
                    </td>

                    {/* 소속 */}
                    <td style={{ fontSize: '13px' }}>{player.heroGym}</td>

                    {/* 액션 */}
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        {/* 순서 올리기 */}
                        <button
                          type="button"
                          onClick={() => movePlayer(index, 'up')}
                          disabled={isFirst || reordering}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 8px', opacity: isFirst ? 0.3 : 1 }}
                          title="위로 이동 (노출 순위 상승)"
                        >
                          <ChevronUp size={14} />
                        </button>

                        {/* 순서 내리기 */}
                        <button
                          type="button"
                          onClick={() => movePlayer(index, 'down')}
                          disabled={isLast || reordering}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 8px', opacity: isLast ? 0.3 : 1 }}
                          title="아래로 이동 (노출 순위 하강)"
                        >
                          <ChevronDown size={14} />
                        </button>

                        <button
                          onClick={() => navigate(`/hero/edit/${player.id}`)}
                          className="btn btn-secondary btn-sm"
                          title="수정"
                        >
                          <Edit2 size={12} />
                          <span>수정</span>
                        </button>

                        <button
                          onClick={() => handleDelete(player.id, player.heroName)}
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-error)' }}
                          title="삭제"
                        >
                          <Trash2 size={12} />
                          <span>삭제</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
