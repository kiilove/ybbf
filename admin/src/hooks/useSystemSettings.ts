import { useState, useCallback } from 'react';
import { adminService } from '../services/adminService';
import type { SystemSettings, HeroPlayer } from '../types/auth';

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.fetchSystemSettings();
      // heroPlayers가 없는 경우 기본 배열 할당
      if (!data.heroPlayers) {
        data.heroPlayers = [];
      }
      setSettings(data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '설정 조회 중 알 수 없는 에러가 발생했습니다.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (updatedSettings: SystemSettings) => {
    setIsUpdating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await adminService.updateSystemSettings(updatedSettings);
      setSettings(updatedSettings);
      setSuccessMsg('설정이 성공적으로 저장되었습니다.');
      // 3초 후 성공 메시지 초기화
      setTimeout(() => setSuccessMsg(null), 3000);
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '설정 저장 중 에러가 발생했습니다.';
      setError(errMsg);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // 선수 추가 헬퍼 함수
  const addHeroPlayer = useCallback(async (newPlayer: HeroPlayer) => {
    if (!settings) return false;
    const updatedPlayers = [...(settings.heroPlayers || []), newPlayer];
    const newSettings: SystemSettings = {
      ...settings,
      heroPlayers: updatedPlayers
    };
    return await saveSettings(newSettings);
  }, [settings, saveSettings]);

  // 선수 수정 헬퍼 함수
  const updateHeroPlayer = useCallback(async (playerId: string, updatedFields: Partial<HeroPlayer>) => {
    if (!settings) return false;
    const updatedPlayers = (settings.heroPlayers || []).map(player => 
      player.id === playerId ? { ...player, ...updatedFields } : player
    );
    const newSettings: SystemSettings = {
      ...settings,
      heroPlayers: updatedPlayers
    };
    return await saveSettings(newSettings);
  }, [settings, saveSettings]);

  // 선수 삭제 헬퍼 함수
  const deleteHeroPlayer = useCallback(async (playerId: string) => {
    if (!settings) return false;
    const updatedPlayers = (settings.heroPlayers || []).filter(player => player.id !== playerId);
    const newSettings: SystemSettings = {
      ...settings,
      heroPlayers: updatedPlayers
    };
    return await saveSettings(newSettings);
  }, [settings, saveSettings]);

  return {
    settings,
    isLoading,
    isUpdating,
    error,
    successMsg,
    fetchSettings,
    saveSettings,
    addHeroPlayer,
    updateHeroPlayer,
    deleteHeroPlayer,
    clearError: () => setError(null),
    clearSuccess: () => setSuccessMsg(null)
  };
}
