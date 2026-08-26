import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import HeroPlayerForm from './HeroPlayerForm';
import { Info } from 'lucide-react';
import type { HeroPlayer } from '../../types/auth';

export default function HeroPlayerEdit() {
  const { id } = useParams<{ id: string }>();
  const { settings, isLoading, isUpdating, error, fetchSettings, updateHeroPlayer } = useSystemSettings();
  const navigate = useNavigate();
  const currentPlayer = settings && id ? (settings.heroPlayers || []).find(player => player.id === id) || null : null;

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings && id && !currentPlayer) {
      alert('선택하신 선수 정보를 찾을 수 없습니다.');
      navigate('/hero');
    }
  }, [settings, id, currentPlayer, navigate]);

  const handleSubmit = async (updatedData: HeroPlayer) => {
    if (!id) return false;
    const success = await updateHeroPlayer(id, updatedData);
    if (success) {
      alert('선수 정보가 변경되었습니다.');
      navigate('/hero');
      return true;
    }
    return false;
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">선수 정보 수정</h1>
          <p className="page-subtitle">대표 선수의 세부 정보를 수정하고 약력을 갱신합니다.</p>
        </div>
      </div>

      {error && (
        <div className="alert-message alert-error">
          <Info size={16} />
          <span>{error}</span>
        </div>
      )}

      {isLoading || !currentPlayer ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
          선수 정보를 불러오는 중입니다...
        </div>
      ) : (
        <HeroPlayerForm
          initialData={currentPlayer}
          onSubmit={handleSubmit}
          isSubmitting={isUpdating}
          submitButtonText="수정 완료 및 저장"
        />
      )}
    </div>
  );
}
