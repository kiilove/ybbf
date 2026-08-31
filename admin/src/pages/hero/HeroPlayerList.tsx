import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { Plus, Edit2, Trash2, UserPlus, Info, Zap } from 'lucide-react';

export default function HeroPlayerList() {
  const { settings, isLoading, error, fetchSettings, saveSettings, deleteHeroPlayer } = useSystemSettings();
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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

      const newHeroPlayers = data.legends.map((l: any) => ({
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

      if (!settings) {
        throw new Error('시스템 설정을 불러오지 못했습니다.');
      }

      const success = await saveSettings({
        ...settings,
        heroPlayers: newHeroPlayers
      });

      if (success) {
        alert(`✅ 대회 그랑프리 ${newHeroPlayers.length}인의 최신 실데이터로 히어로 섹션이 자동 동기화되었습니다!`);
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
        alert('삭제가 완료되었습니다.');
        fetchSettings();
      }
    }
  };

  const heroPlayers = settings?.heroPlayers || [];

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">히어로 섹션 선수 목록</h1>
          <p className="page-subtitle">랜딩페이지 상단 히어로 영역에 노출되는 대표 선수들을 관리합니다.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
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
          <table className="table">
            <thead>
              <tr>
                <th>선수 프로필</th>
                <th>신장 / 체중</th>
                <th>소속</th>
                <th>주요 약력</th>
                <th style={{ textAlign: 'right' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {heroPlayers.map((player) => (
                <tr key={player.id}>
                  <td>
                    <div className="player-row-info">
                      {player.heroImageUrl ? (
                        <img 
                          src={player.heroImageUrl} 
                          alt={player.heroName} 
                          className="player-row-img" 
                        />
                      ) : (
                        <div className="player-row-placeholder">No Img</div>
                      )}
                      <div className="player-details">
                        <span className="player-name">{player.heroName}</span>
                        <span className="player-class">{player.heroClass}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: '500' }}>
                      {(player.heroHeight || player.heroWeight) 
                        ? `${player.heroHeight ? `${player.heroHeight}cm` : '-'} / ${player.heroWeight ? `${player.heroWeight}kg` : '-'}`
                        : '미기재'}
                    </span>
                  </td>
                  <td>{player.heroGym}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span className="user-role" style={{ fontSize: '13px' }}>{player.heroTitles}</span>
                  </td>
                  <td>
                    <div className="table-actions">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
