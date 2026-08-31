import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
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

export default function PreRegistrationManagerPage() {
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
      console.warn('사전 접수자 목록 로드 에러:', err);
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
        alert('삭제 실패');
      }
    }
  };

  // CSV 다운로드
  const handleExportCSV = () => {
    if (registrations.length === 0) {
      alert('다운로드할 사전 접수자 내역이 없습니다.');
      return;
    }

    const headers = ['접수일시', '성명', '연락처', '이메일', '성별', '생년월일', '소속', '희망출전종목', '요청사항'];
    const rows = registrations.map(r => [
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

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
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
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ClipboardList size={24} color="#0f172a" />
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
              2027 제10회 대회 사전 접수자 관리
            </h1>
            <span style={{
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              fontWeight: 700
            }}>
              얼리버드 사전 알림 서비스
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            공식 홈페이지를 통해 2027 제10회 대회 참가 알림 및 얼리버드 접수를 신청한 선수 명단입니다.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={loadRegistrations}
            disabled={loading}
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
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> 새로고침
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#047857',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(4, 120, 87, 0.15)'
            }}
          >
            <Download size={16} /> 엑셀(CSV) 다운로드
          </button>
        </div>
      </div>

      {/* ═══ 통계 카드 ═══ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>총 사전 접수 선수</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{registrations.length}명</h3>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <span style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: 600 }}>보디빌딩 / 클래식 희망</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 800, color: '#1e40af' }}>
            {registrations.filter(r => (r.desiredCategories || []).some(c => c.includes('보디빌딩') || c.includes('클래식'))).length}명
          </h3>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: '#fdf4ff', border: '1px solid #f0abfc' }}>
          <span style={{ fontSize: '12px', color: '#86198f', fontWeight: 600 }}>피지크 / 모델 / 비키니</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 800, color: '#701a75' }}>
            {registrations.filter(r => (r.desiredCategories || []).some(c => c.includes('피지크') || c.includes('비키니') || c.includes('모델'))).length}명
          </h3>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: '12px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
          <span style={{ fontSize: '12px', color: '#047857', fontWeight: 600 }}>학생부 / 유스 희망</span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 800, color: '#065f46' }}>
            {registrations.filter(r => (r.desiredCategories || []).some(c => c.includes('학생부') || c.includes('유스'))).length}명
          </h3>
        </div>
      </div>

      {/* ═══ 검색 및 필터 ═══ */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
        backgroundColor: '#ffffff',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', '보디빌딩', '클래식', '피지크', '비키니', '모델', '학생부'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                border: selectedCategory === cat ? '1px solid #0f172a' : '1px solid #e2e8f0',
                backgroundColor: selectedCategory === cat ? '#0f172a' : '#f8fafc',
                color: selectedCategory === cat ? '#ffffff' : '#475569',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {cat === 'ALL' ? '전체 종목' : cat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="선수명, 연락처, 소속 체육관 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* ═══ 명단 테이블 ═══ */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #cbd5e1',
            borderTopColor: '#0f172a',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px'
          }} />
          사전 접수자 목록을 불러오는 중입니다...
        </div>
      ) : filteredList.length === 0 ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1',
          color: '#64748b'
        }}>
          <AlertCircle size={32} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
          <p style={{ margin: 0, fontWeight: 600 }}>아직 2027 제10회 사전 접수 내역이 없습니다.</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>접수일시</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>선수 성명</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>연락처 / 이메일</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>소속</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>출전 희망 종목</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>요청 및 메시지</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleString('ko-KR') : '-'}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                    {item.name}
                    {item.gender && (
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>({item.gender})</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0f172a', fontWeight: 600 }}>
                      <Phone size={12} color="#047857" /> {item.phone}
                    </div>
                    {item.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                        <Mail size={11} /> {item.email}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#334155' }}>
                    {item.gym || '-'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {(item.desiredCategories || []).map((cat, cIdx) => (
                        <span
                          key={cIdx}
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe'
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#64748b', maxWidth: '240px' }}>
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.message || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(item)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #fecaca',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={12} />
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
