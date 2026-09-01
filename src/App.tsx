import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage'; // 홈 메인 첫 화면은 즉각 렌더링을 위해 정적 로드
import AuthProvider from './components/auth/AuthProvider';
import ScrollToTop from './components/shared/ScrollToTop';

// 🚀 서브 페이지 코드 스플리팅 (초기 번들 크기 최적화 및 TTI 가속)
const LegendsPage = lazy(() => import('./pages/LegendsPage'));
const ChampionsPage = lazy(() => import('./pages/ChampionsPage'));
const LegendDetailPage = lazy(() => import('./pages/LegendDetailPage'));
const MediaPage = lazy(() => import('./pages/MediaPage'));
const YouthPage = lazy(() => import('./pages/YouthPage'));
const YouthDetailPage = lazy(() => import('./pages/YouthDetailPage'));
const CompetitionPage = lazy(() => import('./pages/competition/CompetitionPage'));
const PreRegistrationPage = lazy(() => import('./pages/competition/PreRegistrationPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const SponsorsPage = lazy(() => import('./pages/SponsorsPage'));
const StorePage = lazy(() => import('./pages/StorePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage'));
const AdditionalInfoPage = lazy(() => import('./pages/auth/AdditionalInfoPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const FindAccountPage = lazy(() => import('./pages/auth/FindAccountPage'));
const MyPage = lazy(() => import('./pages/MyPage'));
const PreMeasurementUploadPage = lazy(() => import('./pages/PreMeasurementUploadPage'));
const PlayerShowcasePage = lazy(() => import('./pages/showcase/PlayerShowcasePage'));
const PlayerIntroPage = lazy(() => import('./pages/overlay/PlayerIntroPage'));

// 부드러운 페이지 전환 로딩 스피너
function PageLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#030306] text-white">
      <div className="w-10 h-10 border-2 border-white/20 border-t-[#b4ff00] rounded-full animate-spin mb-4" />
      <span className="text-xs font-mono tracking-widest text-white/50 uppercase">Loading Page...</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="legends" element={<LegendsPage />} />
              <Route path="legends/:id" element={<LegendDetailPage />} />
              <Route path="champions" element={<ChampionsPage />} />
              <Route path="champions/:id" element={<LegendDetailPage />} />
              <Route path="media" element={<MediaPage />} />
              <Route path="youth" element={<YouthPage />} />
              <Route path="youth/:id" element={<YouthDetailPage />} />
              <Route path="competition" element={<CompetitionPage />} />
              <Route path="competition/pre-register" element={<PreRegistrationPage />} />
              <Route path="competition/2027" element={<PreRegistrationPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="sponsors" element={<SponsorsPage />} />
              <Route path="store" element={<StorePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignUpPage />} />
              <Route path="additional-info" element={<AdditionalInfoPage />} />
              <Route path="find-account" element={<FindAccountPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="mypage" element={<MyPage />} />
              <Route path="pre-measurement" element={<PreMeasurementUploadPage />} />
              <Route path="showcase/:id" element={<PlayerShowcasePage />} />
              <Route path="player/:id" element={<PlayerShowcasePage />} />
              {/* 404 와일드카드 fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            <Route path="player-intro" element={<PlayerIntroPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

