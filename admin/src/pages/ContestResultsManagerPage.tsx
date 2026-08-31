import { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Crown,
  ArrowLeft,
  Database
} from 'lucide-react';
import { 
  contestAdminService 
} from '../services/contestAdminService';
import type { 
  AdminContestItem, 
  OfficialCategoryResult 
} from '../services/contestAdminService';
import { getMainSiteUrl } from '../constants/urls';

const CONTEST_STATUS_OPTIONS = [
  { label: '대회 접수중', value: '접수중' },
  { label: '사전계측/무대준비', value: '사전계측' },
  { label: '대회 본선 진행중', value: '대회진행중' },
  { label: '대회종료 & 성적공개', value: '결과공개' },
];

export default function ContestResultsManagerPage() {
  const [contests, setContests] = useState<AdminContestItem[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [selectedContest, setSelectedContest] = useState<AdminContestItem | null>(null);

  const [categoryResults, setCategoryResults] = useState<OfficialCategoryResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingD1, setSavingD1] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [d1SavedInfo, setD1SavedInfo] = useState<{ count: number; savedAt?: string } | null>(null);

  // Search & Filter
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. 대회 목록 로드
  useEffect(() => {
    async function loadContests() {
      setLoading(true);
      try {
        const list = await contestAdminService.fetchContestList();
        setContests(list);
      } catch (err) {
        console.error('대회 목록 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    }
    loadContests();
  }, []);

  // 2. 선택된 대회의 공식 심사 결과 로드 (D1 우선 조회 ➔ 없으면 Firebase에서 Import)
  useEffect(() => {
    if (!selectedContestId) {
      setSelectedContest(null);
      setCategoryResults([]);
      setD1SavedInfo(null);
      return;
    }

    const cur = contests.find((c) => c.id === selectedContestId || c.contestNoticeId === selectedContestId) || null;
    setSelectedContest(cur);

    async function loadResults() {
      setLoading(true);
      try {
        // 1) D1 데이터베이스에서 먼저 조회 시도
        const d1Results = await contestAdminService.fetchOfficialResultsFromD1(selectedContestId!);
        if (d1Results && d1Results.length > 0) {
          setCategoryResults(d1Results);
          setD1SavedInfo({ count: d1Results.length, savedAt: d1Results[0].updatedAt });
        } else {
          // 2) D1에 아직 없으면 Firebase에서 정제하여 가져옴
          const fbResults = await contestAdminService.fetchOfficialResultsByContest(selectedContestId!);
          setCategoryResults(fbResults);
          setD1SavedInfo(null);
        }
      } catch (err) {
        console.error('공식 결과 로드 오류:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, [selectedContestId, contests]);

  // Firebase에서 최신 심사 결과 다시 가져오기 (Re-import)
  const handleReloadFromFirebase = async () => {
    if (!selectedContestId) return;
    setLoading(true);
    try {
      const fbResults = await contestAdminService.fetchOfficialResultsByContest(selectedContestId);
      setCategoryResults(fbResults);
      showToast(`🔥 심사 집계 시스템에서 최신 결과(${fbResults.length}개 종목)를 새로 불러왔습니다.`);
    } catch (err: any) {
      alert('심사 결과 로드 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 💾 Cloudflare D1에 공식 성적 일괄 저장 & 발행
  const handleSaveToD1 = async () => {
    if (!selectedContest || categoryResults.length === 0) return;

    if (!window.confirm(`총 ${categoryResults.length}개 종목/체급의 공식 심사 성적을 Cloudflare D1 데이터베이스에 영구 저장 및 발행하시겠습니까?`)) {
      return;
    }

    setSavingD1(true);
    try {
      await contestAdminService.saveOfficialResultsToD1(selectedContest.id, categoryResults);
      setD1SavedInfo({ count: categoryResults.length, savedAt: new Date().toISOString() });
      showToast(`💾 Cloudflare D1 데이터베이스에 공식 성적이 안전하게 저장 및 발행되었습니다!`);
    } catch (err: any) {
      alert('D1 저장 실패: ' + err.message);
    } finally {
      setSavingD1(false);
    }
  };

  // 대회 상태 변경
  const handleChangeContestStatus = async (newStatus: string) => {
    if (!selectedContest) return;
    try {
      await contestAdminService.updateContestStatus(selectedContest.contestNoticeId || selectedContest.id, newStatus);
      setSelectedContest((prev) => prev ? { ...prev, contestStatus: newStatus } : null);
      setContests((prev) => prev.map((c) => c.id === selectedContest.id ? { ...c, contestStatus: newStatus } : c));
      showToast(`대회 상태가 '${newStatus}'(으)로 변경되었습니다.`);
    } catch (err) {
      alert('대회 상태 변경 실패');
    }
  };

  // 카테고리 필터 목록
  const categoryFilterOptions = useMemo(() => {
    const set = new Set<string>();
    categoryResults.forEach((c) => set.add(c.categoryTitle));
    return Array.from(set);
  }, [categoryResults]);

  // 필터링된 결과 목록
  const filteredCategoryResults = useMemo(() => {
    return categoryResults.filter((c) => {
      if (selectedCategoryFilter !== 'all' && c.categoryTitle !== selectedCategoryFilter) {
        return false;
      }
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const matchCat = c.categoryTitle.toLowerCase().includes(kw);
        const matchGrade = c.gradeTitle.toLowerCase().includes(kw);
        const matchPlayer = c.results.some((p) => 
          p.playerName.toLowerCase().includes(kw) ||
          (p.playerGym && p.playerGym.toLowerCase().includes(kw)) ||
          String(p.playerNumber).includes(kw)
        );
        if (!matchCat && !matchGrade && !matchPlayer) return false;
      }
      return true;
    });
  }, [categoryResults, selectedCategoryFilter, searchKeyword]);

  // 👑 그랑프리 결과 목록
  const grandPrixList = useMemo(() => {
    return categoryResults.filter((c) => c.isOverall);
  }, [categoryResults]);

  // 📋 일반 체급 경기 목록
  const regularCategoryList = useMemo(() => {
    return filteredCategoryResults.filter((c) => !c.isOverall);
  }, [filteredCategoryResults]);

  return (
    <div style={{ padding: '24px 0', maxWidth: '1400px', margin: '0 auto', fontFamily: 'var(--font-sans)' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: '1px solid #38bdf8',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} color="#38bdf8" />
          {toastMessage}
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. 대회 선택 허브 화면 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {!selectedContestId ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                대회 공식 심사 결과 및 D1 영구 저장소
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                용인시보디빌딩협회 대회를 선택하여 공식 심사 결과(1위, 2위, 3위)를 확인하고 Cloudflare D1 데이터베이스에 영구 저장하세요.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {contests.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedContestId(c.id)}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#84cc16')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e2e8f0')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#65a30d', backgroundColor: '#f0fdf4', padding: '2px 6px', borderRadius: '4px' }}>
                    YBBF OFFICIAL
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                    {c.contestStatus || '접수중'}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  {c.contestTitle}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  일자: {c.contestDate || '2026-08-29'} | 장소: {c.contestLocation || '용인시청 에이스홀'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* 2. 공식 결과 기반 정돈된 순위표 화면 */}
          
          {/* Top Back & Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <button
              onClick={() => setSelectedContestId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                color: '#0f172a'
              }}
            >
              <ArrowLeft size={14} />
              <span>대회 목록</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {CONTEST_STATUS_OPTIONS.map((st) => {
                  const isCurrent = selectedContest?.contestStatus === st.value;
                  return (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => handleChangeContestStatus(st.value)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: isCurrent ? 800 : 500,
                        cursor: 'pointer',
                        border: isCurrent ? '1px solid #84cc16' : '1px solid #e2e8f0',
                        backgroundColor: isCurrent ? '#f0fdf4' : '#ffffff',
                        color: isCurrent ? '#65a30d' : '#64748b'
                      }}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleReloadFromFirebase}
                disabled={loading}
                title="Firebase 원본 심사 결과 다시 가져오기"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={12} />
                원본 다시 가져오기
              </button>

              {/* 💾 D1 저장 & 영구 발행 버튼 */}
              <button
                onClick={handleSaveToD1}
                disabled={savingD1 || loading || categoryResults.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 16px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(2,132,199,0.2)'
                }}
              >
                <Database size={13} />
                {savingD1 ? 'D1에 저장 중...' : 'Cloudflare D1에 공식 성적 저장 & 발행'}
              </button>
            </div>
          </div>

          {/* 대회 타이틀 바 */}
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {selectedContest?.contestTitle}
                </h2>
                {d1SavedInfo ? (
                  <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} color="#0369a1" />
                    D1 저장됨 ({d1SavedInfo.count}개 체급)
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', fontWeight: 600, backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px' }}>
                    D1 저장 대기중 (임시 로드됨)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                {selectedContest?.contestDate} • {selectedContest?.contestLocation} • 총 {categoryResults.length}개 종목/체급 공식 심사 데이터
              </div>
            </div>
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* 👑 1. 오버롤 그랑프리 챔피언 결과 섹션 */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {grandPrixList.length > 0 && (
            <div style={{
              backgroundColor: '#fffdf5',
              border: '1px solid #fde047',
              borderRadius: '12px',
              padding: '16px 20px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Crown size={18} color="#ca8a04" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#854d0e' }}>
                  👑 공식 오버롤 그랑프리 챔피언 (Grand Prix Champions)
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
                {grandPrixList.map((gpDoc) => {
                  const winner = gpDoc.results[0];
                  if (!winner) return null;

                  return (
                    <div
                      key={gpDoc.docId}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '2px solid #eab308',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#a16207' }}>
                        {gpDoc.categoryTitle}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', backgroundColor: '#f0fdf4', padding: '2px 6px', borderRadius: '4px' }}>
                            NO.{winner.playerNumber}
                          </span>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>{winner.playerName}</strong>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>({winner.playerGym || '협회'})</span>
                        </div>

                        <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '4px' }}>
                          👑 그랑프리
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search & Category Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="종목, 체급, 선수명 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '6px 10px 6px 30px',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>종목 필터:</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                <option value="all">전체 종목 보기 ({regularCategoryList.length}개 체급)</option>
                {categoryFilterOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* 📋 2. 종목 및 체급별 단정한 순위표 (고정 너비 & 틀 흔들림 없음) */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {loading ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '60px 20px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
              공식 심사 결과를 불러오는 중입니다...
            </div>
          ) : regularCategoryList.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '60px 20px', textAlign: 'center', color: '#64748b', border: '1px solid #e2e8f0' }}>
              해당 조건에 일치하는 심사 결과가 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {regularCategoryList.map((catRes) => {
                return (
                  <div
                    key={catRes.docId}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    {/* Header */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      padding: '10px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                          {catRes.categoryTitle}
                        </strong>
                        <span style={{ fontSize: '12px', color: '#65a30d', fontWeight: 700 }}>
                          [{catRes.gradeTitle}]
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        출전: {catRes.results.length}명
                      </span>
                    </div>

                    {/* Fixed Width Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '90px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '140px' }} />
                        <col style={{ width: 'auto' }} />
                        <col style={{ width: '110px' }} />
                        <col style={{ width: '80px' }} />
                      </colgroup>
                      <thead>
                        <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '11px', textAlign: 'left' }}>
                          <th style={{ padding: '8px 16px' }}>순위</th>
                          <th style={{ padding: '8px 12px' }}>선수번호</th>
                          <th style={{ padding: '8px 12px' }}>선수명</th>
                          <th style={{ padding: '8px 12px' }}>소속 체육관</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center' }}>심사 총점</th>
                          <th style={{ padding: '8px 16px', textAlign: 'right' }}>쇼케이스</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catRes.results.map((r, rIdx) => {
                          const isFirst = r.playerRank === 1;

                          return (
                            <tr
                              key={rIdx}
                              style={{
                                borderBottom: rIdx === catRes.results.length - 1 ? 'none' : '1px solid #f8fafc',
                                backgroundColor: isFirst ? '#fefce8' : '#ffffff'
                              }}
                            >
                              {/* 1. 순위 (군더더기 없는 담백한 표기) */}
                              <td style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
                                {r.playerRank === 1 ? (
                                  <span style={{ color: '#a16207', fontWeight: 800, fontSize: '12px' }}>🥇 1위</span>
                                ) : r.playerRank === 2 ? (
                                  <span style={{ color: '#475569', fontWeight: 800, fontSize: '12px' }}>🥈 2위</span>
                                ) : r.playerRank === 3 ? (
                                  <span style={{ color: '#ea580c', fontWeight: 800, fontSize: '12px' }}>🥉 3위</span>
                                ) : (
                                  <span style={{ color: '#64748b', fontWeight: 600, fontSize: '12px' }}>{r.playerRank}위</span>
                                )}
                              </td>

                              {/* 2. 배번 */}
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#15803d', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                {r.playerNumber ? `NO.${r.playerNumber}` : '-'}
                              </td>

                              {/* 3. 선수명 */}
                              <td style={{ padding: '8px 12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <strong style={{ color: '#0f172a' }}>{r.playerName}</strong>
                              </td>

                              {/* 4. 소속 체육관 (안정적인 레이아웃) */}
                              <td style={{ padding: '8px 12px', color: '#475569', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {r.playerGym || '용인시보디빌딩협회'}
                              </td>

                              {/* 5. 심사 총점 */}
                              <td style={{ padding: '8px 12px', color: '#0f172a', fontWeight: 700, fontSize: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                {r.totalScore !== undefined ? `${r.totalScore}점` : '-'}
                              </td>

                              {/* 6. 쇼케이스 */}
                              <td style={{ padding: '8px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <a
                                  href={`${getMainSiteUrl()}/showcase/${encodeURIComponent(r.playerUid || r.playerNumber)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: '11px',
                                    color: '#2563eb',
                                    textDecoration: 'none',
                                    fontWeight: 600
                                  }}
                                >
                                  보기 ↗
                                </a>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
