import { useEffect, useState } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { 
  ClipboardList, Search, RefreshCw, Trash2, Phone, Mail, 
  Download, AlertCircle
} from 'lucide-react';

export interface PreRegistrationItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthDate?: string;
  gender?: string;
  gym?: string;
  desiredCategories: string[];
  message?: string;
  createdAt: string;
}

export default function PreRegistrationListPage() {
  const [registrations, setRegistrations] = useState<PreRegistrationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    loadRegistrations();
  }, []);

  async function loadRegistrations() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'pre_registrations_2027'));
      const list: PreRegistrationItem[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as PreRegistrationItem);
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRegistrations(list);
    } catch (err) {
      console.warn('2027 사전 접수자 로드 오류:', err);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (item: PreRegistrationItem) => {
    if (window.confirm(`[${item.name}] 선수의 사전 접수 내역을 삭제하시겠습니까?`)) {
      try {
        await deleteDoc(doc(db, 'pre_registrations_2027', item.id));
        setRegistrations((prev) => prev.filter((r) => r.id !== item.id));
      } catch (err) {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleExportCSV = () => {
    if (registrations.length === 0) {
      alert('다운로드할 사전 접수자 내역이 없습니다.');
      return;
    }

    const headers = ['접수일시', '성명', '연락처', '이메일', '성별', '생년월일', '소속', '희망출전종목', '요청사항'];
    const rows = registrations.map((r) => [
      r.createdAt || '',
      r.name || '',
      r.phone || '',
      r.email || '',
      r.gender || '',
      r.birthDate || '',
      r.gym || '',
      (r.desiredCategories || []).join(' / '),
      (r.message || '').replace(/"/g, '""')
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `2027_제10회_대회_사전접수자명단_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredList = registrations.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      (r.gym && r.gym.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat =
      selectedCategory === 'ALL' ||
      (r.desiredCategories && r.desiredCategories.some((c) => c.includes(selectedCategory)));
    return matchSearch && matchCat;
  });

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* ═══ 상단 헤더 ═══ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ClipboardList size={24} color="#b4ff00" />
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>
              2027 제10회 대회 사전 접수자 관리
            </h1>
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: 'rgba(180, 255, 0, 0.15)',
              color: '#b4ff00',
              fontWeight: 800
            }}>
              임원 포털 (Port 4600)
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
            메인 홈페이지를 통해 차기 2027 제10회 대회 사전 알림 및 얼리버드 접수를 신청한 선수 명단입니다.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadRegistrations}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#b4ff00',
              color: '#000000',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Download size={14} /> 엑셀(CSV) 다운로드
          </button>
        </div>
      </div>

      {/* ═══ 통계 요약 바 ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px',
        marginBottom: '20px'
      }}>
        <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600 }}>총 사전 접수 선수</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>{registrations.length}명</h3>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: 'rgba(180, 255, 0, 0.05)', border: '1px solid rgba(180, 255, 0, 0.2)' }}>
          <span style={{ fontSize: '11px', color: '#b4ff00', fontWeight: 600 }}>보디빌딩 / 클래식</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>
            {registrations.filter((r) => (r.desiredCategories || []).some((c) => c.includes('보디빌딩') || c.includes('클래식'))).length}명
          </h3>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
          <span style={{ fontSize: '11px', color: '#eab308', fontWeight: 600 }}>피지크 / 모델 / 비키니</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>
            {registrations.filter((r) => (r.desiredCategories || []).some((c) => c.includes('피지크') || c.includes('비키니') || c.includes('모델'))).length}명
          </h3>
        </div>
        <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>학생부 / 유스 희망</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>
            {registrations.filter((r) => (r.desiredCategories || []).some((c) => c.includes('학생부') || c.includes('유스'))).length}명
          </h3>
        </div>
      </div>

      {/* ═══ 필터 & 검색 ═══ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '18px',
        backgroundColor: '#0f172a',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', '보디빌딩', '클래식', '피지크', '비키니', '모델', '학생부'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '5px 12px',
                borderRadius: '999px',
                border: selectedCategory === cat ? '1px solid #b4ff00' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: selectedCategory === cat ? '#b4ff00' : 'transparent',
                color: selectedCategory === cat ? '#000000' : '#d1d5db',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {cat === 'ALL' ? '전체 종목' : cat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="선수명, 연락처, 소속 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 30px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              color: '#ffffff',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* ═══ 테이블 목록 ═══ */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
          <div style={{
            width: '28px',
            height: '28px',
            border: '2px solid rgba(255,255,255,0.1)',
            borderTopColor: '#b4ff00',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px'
          }} />
          사전 접수자 목록을 불러오는 중입니다...
        </div>
      ) : filteredList.length === 0 ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          color: '#9ca3af'
        }}>
          <AlertCircle size={28} style={{ margin: '0 auto 6px', color: '#6b7280' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>아직 2027 제10회 사전 접수 내역이 없습니다.</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#0b0f19',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'left', color: '#9ca3af' }}>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>접수일시</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>선수 성명</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>연락처 / 이메일</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>소속</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>출전 희망 종목</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>요청 및 메시지</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '12px 14px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleString('ko-KR') : '-'}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: '#ffffff' }}>
                    {item.name}
                    {item.gender && (
                      <span style={{ fontSize: '10px', color: '#9ca3af', marginLeft: '4px' }}>({item.gender})</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b4ff00', fontWeight: 700 }}>
                      <Phone size={11} /> {item.phone}
                    </div>
                    {item.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9ca3af', fontSize: '10px', marginTop: '2px' }}>
                        <Mail size={10} /> {item.email}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#d1d5db' }}>
                    {item.gym || '-'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(item.desiredCategories || []).map((cat, cIdx) => (
                        <span
                          key={cIdx}
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(180, 255, 0, 0.1)',
                            color: '#b4ff00',
                            border: '1px solid rgba(180, 255, 0, 0.2)'
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#9ca3af', maxWidth: '200px' }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.message || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(item)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
