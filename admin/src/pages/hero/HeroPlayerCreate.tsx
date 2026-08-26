import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import HeroPlayerForm from './HeroPlayerForm';
import { Info } from 'lucide-react';
import type { HeroPlayer } from '../../types/auth';

export default function HeroPlayerCreate() {
  const { isLoading, isUpdating, error, fetchSettings, addHeroPlayer } = useSystemSettings();
  const navigate = useNavigate();

  useEffect(() => {
    // 설정을 로드해야 기존 heroPlayers 배열을 바탕으로 새로운 선수를 푸시할 수 있습니다.
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (newPlayer: HeroPlayer) => {
    const success = await addHeroPlayer(newPlayer);
    if (success) {
      alert('신규 선수가 성공적으로 등록되었습니다.');
      navigate('/hero');
      return true;
    }
    return false;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">신규 선수 등록</h1>
          <p className="page-subtitle">랜딩페이지 상단 히어로 영역에 노출할 선수를 신규로 추가합니다.</p>
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
          기존 데이터를 구성하는 중입니다...
        </div>
      ) : (
        <HeroPlayerForm
          onSubmit={handleSubmit}
          isSubmitting={isUpdating}
          submitButtonText="선수 등록 완료"
        />
      )}
    </div>
  );
}
