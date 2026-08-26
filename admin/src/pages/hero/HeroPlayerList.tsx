import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { Plus, Edit2, Trash2, UserPlus, Info } from 'lucide-react';

export default function HeroPlayerList() {
  const { settings, isLoading, error, fetchSettings, deleteHeroPlayer } = useSystemSettings();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`정말 ${name} 선수를 히어로 목록에서 삭제하시겠습니까?`)) {
      const success = await deleteHeroPlayer(id);
      if (success) {
        alert('삭제가 완료되었습니다.');
        // 삭제 성공 후 최신 정보 다시 불러옴
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
        
        <button 
          onClick={() => navigate('/hero/new')} 
          className="btn btn-primary"
        >
          <Plus size={16} />
          <span>신규 선수 등록</span>
        </button>
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
                      {player.heroHeight}cm / {player.heroWeight}kg
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
