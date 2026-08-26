import { useState, useCallback } from 'react';
import { adminService } from '../services/adminService';
import type { SectionItem } from '../types/auth';

export function useLandingSections() {
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSections = useCallback(async (page?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.fetchSections(page);
      setSections(data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '섹션 조회 중 에러가 발생했습니다.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSection = useCallback(async (sectionId: string, payload: Partial<SectionItem>) => {
    setIsUpdating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await adminService.updateSection(sectionId, payload);
      
      // 로컬 상태 즉각 반영
      setSections(prevSections =>
        prevSections.map(sec =>
          sec.sectionId === sectionId ? { ...sec, ...payload } : sec
        )
      );

      setSuccessMsg('섹션 정보가 성공적으로 저장되었습니다.');
      setTimeout(() => setSuccessMsg(null), 3000);
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : '섹션 정보 저장 중 에러가 발생했습니다.';
      setError(errMsg);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    sections,
    isLoading,
    isUpdating,
    error,
    successMsg,
    fetchSections,
    updateSection,
    clearError: () => setError(null),
    clearSuccess: () => setSuccessMsg(null)
  };
}
