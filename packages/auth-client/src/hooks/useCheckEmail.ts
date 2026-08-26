import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

export function useCheckEmail(email: string) {
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setIsDuplicate(false);
      setIsChecking(false);
      setCheckError(null);
      return;
    }

    const handler = setTimeout(async () => {
      setIsChecking(true);
      setCheckError(null);
      try {
        const exists = await authService.checkEmail(email);
        setIsDuplicate(exists);
      } catch (err: any) {
        setCheckError(err.message || '이메일 중복 확인 중 오류가 발생했습니다.');
        setIsDuplicate(false);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [email]);

  return { isDuplicate, isChecking, checkError };
}
