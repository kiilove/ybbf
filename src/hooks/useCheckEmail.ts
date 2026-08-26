import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

/**
 * 이메일 입력을 모니터링하여 백엔드 API를 통해 중복 여부를 검사하는 커스텀 훅
 * @param email 검사할 이메일 문자열
 * @returns { isDuplicate: 중복 여부, isChecking: 검사 진행 중 여부, checkError: 에러 메시지 }
 */
export function useCheckEmail(email: string) {
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    // 이메일 정규표현식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setIsDuplicate(false);
      setIsChecking(false);
      setCheckError(null);
      return;
    }

    // 디바운스 적용 (500ms 타이핑 대기)
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
