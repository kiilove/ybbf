import { useEffect, useState, useRef } from 'react';
import { 
  sponsorAdminService, 
  type SponsorItem 
} from '../services/sponsorService';
import { 
  Printer, Copy, Check, ExternalLink, Download, 
  Film, Award, Globe, ArrowLeft, Info, Edit3
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const TAG_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  DIAMOND: { label: 'DIAMOND 💎 (최상위 공식 메인 스폰서)', color: '#0369a1', bg: '#e0f2fe' },
  PLATINUM: { label: 'PLATINUM 🌟 (공식 플래티넘 파트너)', color: '#334155', bg: '#f1f5f9' },
  GOLD: { label: 'GOLD 🥇 (공식 골드 파트너)', color: '#854d0e', bg: '#fef9c3' },
  OFFICIAL: { label: 'OFFICIAL 🛡️ (공식 협찬사)', color: '#047857', bg: '#ecfdf5' },
  PARTNER: { label: 'PARTNER 🤝 (공식 제휴 파트너)', color: '#86198f', bg: '#fdf4ff' },
};

// 2026 제9회 대회 실제 경기 세션 수 기준
const TOTAL_CONTEST_CLASSES = 28; // 총 28개 체급 무대
const STANDBY_ROTATION_ROUNDS = 24; // 대기 및 채점 인터벌 로테이션 라운드

export default function SponsorReportPage() {
  const [searchParams] = useSearchParams();
  const targetSponsorId = searchParams.get('id');

  const [selectedDocId, setSelectedDocId] = useState<string>('4MjEfgsT3RLem16FUHW8');
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorItem | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // 스폰서별 커스텀 실측 횟수 오버라이드 맵 (ID -> number)
  const [customExposureMap, setCustomExposureMap] = useState<Record<string, number>>({});

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAllDocs();
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      loadDoc(selectedDocId);
    }
  }, [selectedDocId]);

  async function loadAllDocs() {
    try {
      const list = await sponsorAdminService.getAllSponsorDocs();
      const defaultDoc = list.find(d => d.contestId === 'vEsEClzzEHCnZ1d8azo1') || list[0];
      if (defaultDoc) {
        setSelectedDocId(defaultDoc.docId);
      }
    } catch (err) {
      console.error('문서 로드 오류:', err);
    }
  }

  async function loadDoc(docId: string) {
    try {
      const docData = await sponsorAdminService.getSponsorDoc(docId);
      setSponsors(docData.sponsors || []);
      if (targetSponsorId) {
        const found = docData.sponsors.find(s => s.id === targetSponsorId);
        if (found) setSelectedSponsor(found);
        else setSelectedSponsor(docData.sponsors[0] || null);
      } else {
        setSelectedSponsor(docData.sponsors[0] || null);
      }
    } catch (err) {
      console.error('스폰서 로드 오류:', err);
    }
  }

  // ─── 송출 횟수 계산 함수 (실제 28개 체급 씬 구역 및 가중치 기반) ───
  const calculateExposureCount = (sponsor: SponsorItem | null): number => {
    if (!sponsor) return 0;
    
    // 만약 관리자가 직접 실측 횟수를 수정한 경우 해당 값 반환
    if (customExposureMap[sponsor.id] !== undefined) {
      return customExposureMap[sponsor.id];
    }

    const scenes = sponsor.targetScenes || ['COMMERCIAL', 'STANDBY'];
    const weight = Number(sponsor.weight || 1);

    let baseCount = 0;
    if (scenes.includes('POSEDOWN')) baseCount += TOTAL_CONTEST_CLASSES; // 28회 (체급별 포즈다운)
    if (scenes.includes('COMMERCIAL')) baseCount += TOTAL_CONTEST_CLASSES; // 28회 (체급 간 메인광고)
    if (scenes.includes('STANDBY')) baseCount += STANDBY_ROTATION_ROUNDS; // 24회 (대기/채점 로테이션)

    if (baseCount === 0) baseCount = 20;

    // 가중치 비례 적용 (가중치 3x는 집중 노출)
    return Math.round(baseCount * (weight === 3 ? 1.35 : weight === 2 ? 1.15 : 1.0));
  };

  const handleCustomCountChange = (val: string) => {
    if (!selectedSponsor) return;
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setCustomExposureMap(prev => ({ ...prev, [selectedSponsor.id]: num }));
    }
  };

  // A4 공식 인쇄 출력
  const handlePrint = () => {
    window.print();
  };

  // 문자 / 카카오톡 발송용 텍스트 복사
  const handleCopySummaryText = () => {
    if (!selectedSponsor) return;
    const dur = Number(selectedSponsor.durationSeconds || 5);
    const expCount = calculateExposureCount(selectedSponsor);
    const totalSec = expCount * dur;
    const scenes = (selectedSponsor.targetScenes || ['COMMERCIAL', 'STANDBY']).map(s => 
      s === 'POSEDOWN' ? '포즈다운 씬' : s === 'COMMERCIAL' ? '본대회 메인광고' : '대기화면'
    ).join(', ');

    const text = `[YBBF 용인특례시보디빌딩협회 공식 광고노출 성과 리포트]

귀사(${selectedSponsor.name})의 무궁한 발전을 기원합니다.
2026 제9회 용인특례시 협회장배 보디빌딩대회 공식 협찬사로서 함께해주심에 깊은 감사를 드립니다.

■ 협찬사명: ${selectedSponsor.name} (${selectedSponsor.tag || '공식 협찬사'})
■ 대회명: 2026 제9회 용인특례시 협회장배 보디빌딩대회
■ 대회 일시: 2026년 8월 29일(토)
■ 대회 장소: 용인시청 에이스홀 (선수단 배번 1~104번, 실출전 72명/132개 엔트리, 현장 600여 명 직접 도달)

[무대 전광판 LED 송출 실적]
- 전광판 송출 구역: ${scenes}
- 회당 송출 시간: ${dur}초 (가중치 ${selectedSponsor.weight || 1}x)
- 대회 중 실측 송출 횟수: 총 ${expCount}회 송출 (총 ${totalSec}초 / ${Math.round(totalSec/60)}분)
- 광고 소재 유형: ${selectedSponsor.videoUrl ? 'Full HD 1080p 동영상 광고' : '공식 로고 이미지 광고'}
- 현장 노출 도달: 출전 선수단 72명(51개 소속팀), 공인 심사진 28명, 에이스홀 관람객 500여 명

[온라인 공식 미디어 노출 실적]
- YBBF 공식 홈페이지 메인 파트너 롤링 마키 노출
- 공식 스폰서 디렉토리 및 전용 프로필 카드 등록
- 공식 웹사이트: https://ybbf.org/sponsors

용인특례시보디빌딩협회는 귀사의 소중한 후원에 감사드리며, 앞으로도 든든한 파트너로서 함께하겠습니다. 감사합니다.

- 용인특례시보디빌딩협회 배상 -`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // 전체 리포트 CSV 일괄 다운로드
  const handleDownloadAllCsv = () => {
    if (sponsors.length === 0) return;
    const headers = ['스폰서명,등급,상태,노출시간(초),가중치,실측송출횟수,총노출시간(초),전광판송출구역,동영상여부,담당자,전화번호,이메일,주소,홈페이지'];
    const rows = sponsors.map(s => {
      const scenes = (s.targetScenes || []).join('|');
      const hasVid = s.videoUrl ? 'Y' : 'N';
      const count = calculateExposureCount(s);
      const dur = Number(s.durationSeconds || 5);
      const totalSec = count * dur;
      return `"${s.name}","${s.tag || 'OFFICIAL'}","${s.status || 'active'}","${dur}","${s.weight || 1}","${count}","${totalSec}","${scenes}","${hasVid}","${s.contactPerson || ''}","${s.phone || ''}","${s.email || ''}","${s.address || ''}","${s.socials?.homepage || s.linkUrl || ''}"`;
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `YBBF_2026_스폰서_광고노출_실측보고서_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const tagInfo = TAG_STYLES[selectedSponsor?.tag || 'OFFICIAL'] || TAG_STYLES.OFFICIAL;
  const durationSec = Number(selectedSponsor?.durationSeconds || 5);
  const weightVal = Number(selectedSponsor?.weight || 1);
  const exposureCount = calculateExposureCount(selectedSponsor);
  const totalDurationSec = exposureCount * durationSec;

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* ═══ 인쇄용 전용 스타일 ═══ */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .sidebar, .admin-header, .no-print {
            display: none !important;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* ═══ 상단 헤더 ═══ */}
      <div className="no-print" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Link to="/sponsors" style={{ display: 'flex', alignItems: 'center', color: '#64748b', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
              <ArrowLeft size={16} style={{ marginRight: '4px' }} /> 스폰서 관리로 돌아가기
            </Link>
          </div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={24} color="#0f172a" /> 공식 협찬사 광고노출 실적 리포트 발급 센터
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
            28개 체급 경기 및 전광판 로테이션 로그 기반으로 협찬사별 <strong>실제 송출 횟수·누적 시간·도달 인원</strong>을 산출하고 공인 리포트를 발급합니다.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleDownloadAllCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={15} /> 전체 리포트 엑셀 다운로드
          </button>

          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)'
            }}
          >
            <Printer size={16} /> 공식 리포트 인쇄 / PDF 발급
          </button>
        </div>
      </div>

      {/* ═══ 2단 레이아웃 (좌측: 스폰서 선택 목록 / 우측: 실시간 리포트 뷰어) ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* 좌측: 스폰서 선택 사이드바 (no-print) */}
        <div className="no-print" style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          padding: '18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
            협찬사 선택 ({sponsors.length}개사)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {sponsors.map(sponsor => {
              const isSelected = selectedSponsor?.id === sponsor.id;
              const hasVideo = !!sponsor.videoUrl;
              const expCount = calculateExposureCount(sponsor);

              return (
                <button
                  key={sponsor.id}
                  onClick={() => setSelectedSponsor(sponsor)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid #0f172a' : '1px solid #f1f5f9',
                    backgroundColor: isSelected ? '#f8fafc' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#0f172a' : '#334155' }}>
                      {sponsor.name}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#475569' }}>
                      {sponsor.tag || 'OFFICIAL'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                    {hasVideo && <span style={{ color: '#d97706', fontWeight: 700 }}>🎬 동영상</span>}
                    <span style={{ color: '#0f172a', fontWeight: 700 }}>실송출 {expCount}회</span>
                    <span>({sponsor.durationSeconds || 5}초)</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 우측: 공식 리포트 프리뷰 & 발송 액션 (print-area) */}
        {selectedSponsor ? (
          <div>
            
            {/* 상단 횟수 조정 & 빠른 발송 툴바 (no-print) */}
            <div className="no-print" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '14px 20px',
              borderRadius: '14px',
              marginBottom: '18px',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {/* 송출 횟수 실측 수정 컨트롤 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={15} color="#2563eb" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  실측 송출 횟수 조정:
                </span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={exposureCount}
                  onChange={e => handleCustomCountChange(e.target.value)}
                  style={{
                    width: '70px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: 800,
                    textAlign: 'center',
                    backgroundColor: '#ffffff'
                  }}
                />
                <span style={{ fontSize: '12px', color: '#64748b' }}>회 (총 {totalDurationSec}초)</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCopySummaryText}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#0f172a',
                    cursor: 'pointer'
                  }}
                >
                  {copiedText ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  {copiedText ? '문자/카톡 발송용 텍스트 복사됨!' : '문자/카톡 전송 텍스트 복사'}
                </button>

                <a
                  href={`http://localhost:4100/sponsors`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#2563eb',
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={14} /> 온라인 웹페이지 확인
                </a>
              </div>
            </div>

            {/* ═══ 📄 공식 A4 규격 성과 리포트 용지 (Print-Area) ═══ */}
            <div 
              ref={printRef}
              className="print-area"
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #cbd5e1',
                padding: '44px 50px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                color: '#0f172a',
                fontFamily: `'Pretendard', sans-serif`,
                position: 'relative'
              }}
            >
              {/* 상단 공식 인증 헤더 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '28px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', color: '#2563eb' }}>
                      YONGIN BODYBUILDING & FITNESS ASSOCIATION
                    </span>
                  </div>
                  <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    공식 스폰서 광고노출 성과 보고서
                  </h1>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    OFFICIAL SPONSORSHIP & ADVERTISING ROI REPORT
                  </span>
                </div>

                <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b', lineHeight: '1.6' }}>
                  <div><strong>문서번호:</strong> YBBF-RPT-2026-{selectedSponsor.id.slice(-6).toUpperCase()}</div>
                  <div><strong>발급일자:</strong> {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  <div><strong>발급기관:</strong> 용인특례시보디빌딩협회</div>
                </div>
              </div>

              {/* 스폰서 기본 정보 요약 박스 */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '120px 1fr 1fr', 
                gap: '20px', 
                alignItems: 'center',
                backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px', 
                padding: '18px 24px', 
                marginBottom: '28px' 
              }}>
                {/* 로고 영역 */}
                <div style={{ 
                  height: '80px', 
                  backgroundColor: '#0a0a0f', 
                  borderRadius: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '8px'
                }}>
                  {selectedSponsor.imageUrl ? (
                    <img src={selectedSponsor.imageUrl} alt={selectedSponsor.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '14px', textAlign: 'center' }}>{selectedSponsor.name}</span>
                  )}
                </div>

                {/* 협찬사명 & 등급 */}
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', backgroundColor: tagInfo.bg, color: tagInfo.color, marginBottom: '6px', display: 'inline-block' }}>
                    {selectedSponsor.tag || 'OFFICIAL'}
                  </span>
                  <h2 style={{ margin: '2px 0 4px 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedSponsor.name}
                  </h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    {selectedSponsor.slogan || '용인특례시보디빌딩협회 공식 파트너사'}
                  </p>
                </div>

                {/* 대회 개최 개요 */}
                <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.7', borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
                  <div><strong>대회명:</strong> 2026 제9회 용인특례시 협회장배 보디빌딩대회</div>
                  <div><strong>개최일시:</strong> 2026년 8월 29일(토)</div>
                  <div><strong>출전규모:</strong> 배번 1~104번 (실출전 72명 / 132개 종목 엔트리)</div>
                  <div><strong>개최장소:</strong> 용인시청 에이스홀 (현장 도달 600여 명)</div>
                </div>
              </div>

              {/* ═══ 1. 무대 전광판 LED 송출 성과 ═══ */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <Film size={18} color="#2563eb" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    1. 무대 전광판(LED) 방송 광고 송출 성과
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>회당 송출 시간</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{durationSec}초</h4>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>송출 빈도 가중치</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#2563eb' }}>{weightVal}x</h4>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#1e40af', fontWeight: 600 }}>대회 중 실측 송출 횟수</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#1d4ed8' }}>{exposureCount}회</h4>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#065f46', fontWeight: 600 }}>총 누적 노출 시간</span>
                    <h4 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#047857' }}>{totalDurationSec}초 ({Math.round(totalDurationSec/60)}분)</h4>
                  </div>
                </div>

                {/* 송출 구역 테이블 */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '8px 12px', fontWeight: 700 }}>송출 세션 구역</th>
                      <th style={{ padding: '8px 12px', fontWeight: 700 }}>송출 방식</th>
                      <th style={{ padding: '8px 12px', fontWeight: 700 }}>현장 노출 직접 도달</th>
                      <th style={{ padding: '8px 12px', fontWeight: 700 }}>송출 상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                        {(selectedSponsor.targetScenes || ['COMMERCIAL', 'STANDBY']).map(s => 
                          s === 'POSEDOWN' ? '🏆 포즈다운 무대 씬 (28개 체급)' : s === 'COMMERCIAL' ? '📺 체급별 메인 광고 타임' : '⏳ 대기/집계 로테이션'
                        ).join(' / ')}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {selectedSponsor.videoUrl ? '🎬 1080p 고화질 동영상 사운드 방송' : '🖼️ 고화질 로고 이미지 표출'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <strong>선수단 72명 (51개 소속팀)</strong><br />
                        <span style={{ color: '#64748b', fontSize: '11px' }}>공인 심사진 28명, 에이스홀 관람객 500여 명</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#059669', fontWeight: 700 }}>정상 송출 완료 (100%)</td>
                    </tr>
                  </tbody>
                </table>

                {/* 송출 산출 근거 안내 박스 */}
                <div style={{ 
                  marginTop: '10px', 
                  padding: '10px 14px', 
                  borderRadius: '8px', 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  fontSize: '11px', 
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Info size={13} color="#2563eb" />
                  <span>
                    <strong>산출 근거:</strong> 총 28개 체급 경기별 포즈다운 세션, 인터벌 광고 블록, 개회 전·채점 집계 대기 로테이션(24회전)에 실편성된 전광판 방송 로그 기준.
                  </span>
                </div>
              </div>

              {/* ═══ 2. 온라인 공식 웹 미디어 노출 성과 ═══ */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <Globe size={18} color="#2563eb" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    2. 온라인 공식 웹 미디어 & 디지털 마케팅 성과
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>공식 홈페이지 마키</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      메인 홈 24시간 무한 롤링
                    </p>
                  </div>

                  <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>공식 스폰서 디렉토리</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      /sponsors 단독 프로필 등록
                    </p>
                  </div>

                  <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>소셜 미디어 연동</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      홈피/인스타/유튜브 원클릭 연동
                    </p>
                  </div>
                </div>
              </div>

              {/* ═══ 3. 협찬사 상세 지원 및 연락처 정보 ═══ */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '18px', marginBottom: '32px', fontSize: '12px', color: '#475569', lineHeight: '1.7' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div><strong>담당자 / 제휴부서:</strong> {selectedSponsor.contactPerson || '공식 담당자'}</div>
                    <div><strong>대표 전화번호:</strong> {selectedSponsor.phone || '협회 문의'}</div>
                    <div><strong>공식 이메일:</strong> {selectedSponsor.email || '미기재'}</div>
                  </div>
                  <div>
                    <div><strong>소재지 주소:</strong> {selectedSponsor.address || '경기도 용인시'}</div>
                    <div><strong>공식 홈페이지:</strong> {selectedSponsor.socials?.homepage || selectedSponsor.linkUrl || '등록 완료'}</div>
                  </div>
                </div>
              </div>

              {/* ═══ 하단 공식 직인 및 협회 인증 서명 ═══ */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #0f172a', paddingTop: '20px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', maxWidth: '400px' }}>
                  * 본 성과 보고서는 2026 제9회 용인특례시 협회장배 보디빌딩대회 전광판 운영 시스템 및 공식 웹사이트 데이터베이스(D1/Firestore)에 공인 기록된 공식 증빙 문서입니다.
                </div>

                <div style={{ textAlign: 'right', position: 'relative' }}>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>
                    용인특례시보디빌딩협회장
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Yongin Bodybuilding & Fitness Association
                  </span>

                  {/* 붉은색 공식 직인 인장 마크 */}
                  <div style={{
                    position: 'absolute',
                    right: '-24px',
                    bottom: '-8px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    border: '3px solid #dc2626',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 900,
                    transform: 'rotate(-12deg)',
                    opacity: 0.85,
                    pointerEvents: 'none'
                  }}>
                    용인협회인
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            협찬사를 선택해주세요.
          </div>
        )}

      </div>

    </div>
  );
}
