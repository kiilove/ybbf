import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { forceScrollToTop } from '../utils/scrollUtils';

/**
 * 페이지 최상단 강제 스크롤 커스텀 훅
 * 
 * @param deps (선택) 데이터 로딩 완료 시점이나 상태 변화 시 재실행할 의존성 배열 [loading] 등
 * 
 * @example
 * // 1. 단순 페이지 마운트 시
 * useScrollToTop();
 * 
 * // 2. 비동기 데이터 로딩 완료 후
 * const [loading, setLoading] = useState(true);
 * useScrollToTop([loading]);
 */
export function useScrollToTop(deps: any[] = []) {
  const { pathname, search } = useLocation();

  useEffect(() => {
    forceScrollToTop();
  }, [pathname, search, ...deps]);
}

export default useScrollToTop;
