import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LegendsPage from './pages/LegendsPage';
import ChampionsPage from './pages/ChampionsPage';
import LegendDetailPage from './pages/LegendDetailPage';
import MediaPage from './pages/MediaPage';
import YouthPage from './pages/YouthPage';
import YouthDetailPage from './pages/YouthDetailPage';
import CompetitionPage from './pages/competition/CompetitionPage';
import AboutPage from './pages/AboutPage';
import StorePage from './pages/StorePage';
import SponsorsPage from './pages/SponsorsPage';
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import AdditionalInfoPage from './pages/auth/AdditionalInfoPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import FindAccountPage from './pages/auth/FindAccountPage';
import MyPage from './pages/MyPage';
import AuthProvider from './components/auth/AuthProvider';
import PlayerIntroPage from './pages/overlay/PlayerIntroPage';
import PreMeasurementUploadPage from './pages/PreMeasurementUploadPage';
import PlayerShowcasePage from './pages/showcase/PlayerShowcasePage';
import PreRegistrationPage from './pages/competition/PreRegistrationPage';
import ScrollToTop from './components/shared/ScrollToTop';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
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
          </Route>
          <Route path="player-intro" element={<PlayerIntroPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

