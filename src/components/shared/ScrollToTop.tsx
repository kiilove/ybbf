import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { forceScrollToTop } from '../../utils/scrollUtils';

/**
 * React Router 전역 최상단 스크롤 컨트롤러 컴포넌트
 * App.tsx의 <BrowserRouter> 최상단에 마운트되어 모든 라우트 변경을 실시간 감지하고 리셋합니다.
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    forceScrollToTop();
  }, [pathname, search]);

  return null;
}
