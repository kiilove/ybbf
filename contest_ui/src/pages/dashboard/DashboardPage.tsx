import { useEffect, useState } from 'react';
import { useContest } from '../../hooks/useContest';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import type { SimpleContest } from '../../services/authService';
import { Users, ShieldAlert, BadgeCent, Percent, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { staff } = useAuth();
  const { fetchList, setFilter, getStats, registrations, isLoading, filters } = useContest();
  const [contests, setContests] = useState<SimpleContest[]>([]);

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

  const stats = getStats();

  const handleContestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter('contestId', e.target.value);
  };

  // Get recent 5 registrations
  const recentRegistrations = [...registrations]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5);

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

  return (
    <div>
      {/* Contest filter bar (only shown to general staff/admin who can manage multiple contests) */}
      {!staff?.contestId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', backgroundColor: 'var(--color-bg-secondary)', padding: '16px 24px', borderRadius: '12px', border: '1px solid var(--color-divider)' }}>
          <Calendar size={18} style={{ color: 'var(--color-accent)' }} />
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>조회할 대회 선택:</span>
          <select 
            className="form-select" 
            style={{ width: '320px', margin: 0, padding: '8px 12px' }}
            value={filters.contestId}
            onChange={handleContestChange}
            disabled={isLoading}
          >
            <option value="">전체 대회</option>
            {contests.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="no-data">대회 데이터를 로드하는 중...</div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card accent">
              <div className="stat-title">총 접수 인원</div>
              <div className="stat-value">{stats.total} 명</div>
              <div className="stat-desc">취소/대기 포함 누적 인원</div>
              <Users size={40} style={{ position: 'absolute', right: '16px', bottom: '16px', color: 'rgba(255,255,255,0.03)' }} />
            </div>

            <div className="stat-card accent">
              <div className="stat-title">입금 완료</div>
              <div className="stat-value" style={{ color: 'var(--color-accent)' }}>{stats.paid} 명</div>
              <div className="stat-desc">정상 참가 대상 인원</div>
              <BadgeCent size={40} style={{ position: 'absolute', right: '16px', bottom: '16px', color: 'rgba(255,255,255,0.03)' }} />
            </div>

            <div className="stat-card danger">
              <div className="stat-title">접수 취소</div>
              <div className="stat-value" style={{ color: 'var(--color-error)' }}>{stats.canceled} 명</div>
              <div className="stat-desc">신청 후 취소 처리된 건</div>
              <ShieldAlert size={40} style={{ position: 'absolute', right: '16px', bottom: '16px', color: 'rgba(255,255,255,0.03)' }} />
            </div>

            <div className="stat-card">
              <div className="stat-title">입금 완료율</div>
              <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {stats.paymentRate}
                <Percent size={24} style={{ color: 'var(--color-accent)', marginTop: '4px' }} />
              </div>
              <div className="stat-desc">대비 입금 확인 완료 비율</div>
              {/* Progress bar */}
              <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${stats.paymentRate}%`, height: '100%', backgroundColor: 'var(--color-accent)' }}></div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginTop: '32px' }}>
            {/* Recent Registrations Table */}
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--color-text-primary)' }}>최근 접수 신청 현황</h2>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>신청자명</th>
                      <th>성별</th>
                      <th>소속 (Gym)</th>
                      <th>종목수</th>
                      <th>접수 시각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRegistrations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="no-data">최근 접수 내역이 없습니다.</td>
                      </tr>
                    ) : (
                      recentRegistrations.map((reg) => (
                        <tr key={reg.id}>
                          <td style={{ fontWeight: 'bold' }}>{reg.playerName}</td>
                          <td>{reg.playerGender === 'm' ? '남성' : '여성'}</td>
                          <td>{reg.playerGym}</td>
                          <td>
                            <span className="badge success">{reg.joins?.length || 0}개</span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                            {formatDate(reg.submittedAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-divider)', borderRadius: '12px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--color-text-primary)' }}>수납 정산 요약</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>총 수납 금액 (입금 완료 기준)</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-accent)' }}>
                    {formatPrice(stats.totalRevenue)}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--color-divider)', padding: '16px 0', marginTop: '8px' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>대기 금액 (미결제 건)</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {formatPrice(registrations.filter(r => !r.isPriceCheck && !r.isCanceled).reduce((sum, r) => sum + r.contestPriceTotal, 0))}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>취소/환불 대상 금액</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-error)' }}>
                    {formatPrice(registrations.filter(r => r.isCanceled).reduce((sum, r) => sum + r.contestPriceTotal, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
