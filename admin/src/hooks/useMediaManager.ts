import { useState, useCallback } from 'react';
import { adminService } from '../services/adminService';
import type { MediaItem } from '../types/auth';

export function useMediaManager() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadMediaList = useCallback(async (category?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.fetchMediaList(category);
      // 정렬 순서대로 1차 가공 (sortOrder 오름차순, 그다음 date 내림차순)
      const sorted = [...data].sort((a, b) => {
        const orderA = a.sortOrder || 0;
        const orderB = b.sortOrder || 0;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      setMediaList(sorted);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '미디어 목록을 불러오지 못했습니다.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMediaItem = useCallback(async (payload: Omit<MediaItem, 'createdAt'>) => {
    setIsUpdating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await adminService.createMedia(payload);
      setSuccessMsg('동영상 콘텐츠가 등록되었습니다.');
      setTimeout(() => setSuccessMsg(null), 3000);
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '동영상 등록 중 에러가 발생했습니다.';
      setError(errMsg);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const editMediaItem = useCallback(async (id: string, payload: Omit<MediaItem, 'id' | 'createdAt'>) => {
    setIsUpdating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await adminService.updateMedia(id, payload);
      setSuccessMsg('동영상 콘텐츠 정보가 수정되었습니다.');
      setTimeout(() => setSuccessMsg(null), 3000);
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '동영상 정보 수정 중 에러가 발생했습니다.';
      setError(errMsg);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const removeMediaItem = useCallback(async (id: string) => {
    setIsUpdating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await adminService.deleteMedia(id);
      setMediaList(prev => prev.filter(item => item.id !== id));
      setSuccessMsg('동영상 콘텐츠가 삭제되었습니다.');
      setTimeout(() => setSuccessMsg(null), 3000);
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '동영상 삭제 중 에러가 발생했습니다.';
      setError(errMsg);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    mediaList,
    isLoading,
    isUpdating,
    error,
    successMsg,
    loadMediaList,
    addMediaItem,
    editMediaItem,
    removeMediaItem,
    clearError: () => setError(null),
    clearSuccess: () => setSuccessMsg(null)
  };
}
